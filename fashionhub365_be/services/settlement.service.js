const httpStatus = require('http-status');
const { Settlement, Order, Store } = require('../models');
const ApiError = require('../utils/ApiError');
const walletService = require('./wallet.service');
const platformLedgerService = require('./platformLedger.service');

const DEFAULT_PLATFORM_FEE_PERCENT = Number(process.env.SETTLEMENT_PLATFORM_FEE_PERCENT || 10);
const RELEASE_ELIGIBLE_ORDER_STATUSES = new Set(['delivered']);

const buildSettlementAmounts = (order) => {
    const grossAmount = (order.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const shippingAmount = Number(order.shipping_fee || 0);
    const discountAmount = Number(order.discount_total || 0);
    const platformFeeAmount = Math.max(0, Math.round(grossAmount * DEFAULT_PLATFORM_FEE_PERCENT / 100));
    const paymentFeeAmount = 0;
    const netAmount = Math.max(0, Number(order.total_amount || 0) - platformFeeAmount - paymentFeeAmount);

    return {
        grossAmount,
        shippingAmount,
        discountAmount,
        platformFeeAmount,
        paymentFeeAmount,
        netAmount,
    };
};

const ensureOrderReadyForSettlement = (order) => {
    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }
    if (order.payment_status !== 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Settlement can only be created for paid orders');
    }
};

const createSettlementForPaidOrder = async (orderId, paymentId = null, options = {}) => {
    const { session } = options;
    const orderQuery = Order.findById(orderId);
    if (session) {
        orderQuery.session(session);
    }

    const order = await orderQuery;
    ensureOrderReadyForSettlement(order);

    const storeQuery = Store.findById(order.store_id).select('owner_user_id');
    if (session) {
        storeQuery.session(session);
    }

    const store = await storeQuery;
    if (!store?.owner_user_id) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Store owner is missing for settlement');
    }

    const amounts = buildSettlementAmounts(order);
    const update = {
        order_id: order._id,
        store_id: order.store_id,
        seller_user_id: store.owner_user_id,
        currency: order.currency || 'VND',
        gross_amount: amounts.grossAmount,
        shipping_amount: amounts.shippingAmount,
        discount_amount: amounts.discountAmount,
        platform_fee_amount: amounts.platformFeeAmount,
        payment_fee_amount: amounts.paymentFeeAmount,
        net_amount: amounts.netAmount,
        notes: `Auto-generated for order ${order.uuid}`,
        metadata: {
            paymentMethod: order.payment_method,
            orderStatus: order.status,
            platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
        },
        ...(paymentId ? { payment_id: paymentId } : {}),
    };

    const settlement = await Settlement.findOneAndUpdate(
        { order_id: order._id },
        { $set: update, $setOnInsert: { status: 'pending' } },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            ...(session ? { session } : {}),
        }
    );

    await platformLedgerService.recordPlatformFeeForSettlement(settlement, { session });
    return settlement;
};

const releaseSettlementToWallet = async (orderId, options = {}) => {
    const { session } = options;
    const settlementQuery = Settlement.findOne({ order_id: orderId });
    if (session) {
        settlementQuery.session(session);
    }

    const settlement = await settlementQuery;
    if (!settlement || settlement.status !== 'pending') {
        return settlement;
    }

    const orderQuery = Order.findById(orderId).select('status payment_status uuid');
    if (session) {
        orderQuery.session(session);
    }

    const order = await orderQuery;
    if (!order || !RELEASE_ELIGIBLE_ORDER_STATUSES.has(order.status) || order.payment_status !== 'paid') {
        return settlement;
    }

    await walletService.deposit(
        settlement.seller_user_id,
        Number(settlement.net_amount || 0),
        `Settlement released for order ${order.uuid}`,
        { session }
    );

    settlement.status = 'available';
    settlement.available_at = new Date();
    settlement.released_to_wallet_at = new Date();
    settlement.notes = `${settlement.notes || ''}`.trim() || `Released for order ${order.uuid}`;
    await settlement.save(session ? { session } : {});

    return settlement;
};

const cancelSettlementForOrder = async (orderId, reason = 'Order cancelled before payout', options = {}) => {
    const { session } = options;
    const settlementQuery = Settlement.findOne({ order_id: orderId });
    if (session) {
        settlementQuery.session(session);
    }

    const settlement = await settlementQuery;
    if (!settlement || settlement.status !== 'pending') {
        return settlement;
    }

    settlement.status = 'cancelled';
    settlement.notes = reason;
    await settlement.save(session ? { session } : {});
    return settlement;
};

const refundSettlementForOrder = async (orderId, reason = 'Order refunded', options = {}) => {
    const { session } = options;
    const settlementQuery = Settlement.findOne({ order_id: orderId });
    if (session) {
        settlementQuery.session(session);
    }

    const settlement = await settlementQuery;
    if (!settlement || settlement.status === 'refunded') {
        return settlement;
    }

    const orderQuery = Order.findById(orderId).select('uuid');
    if (session) {
        orderQuery.session(session);
    }

    const order = await orderQuery;
    const reversalAmount = Number(settlement.net_amount || 0);
    const nextMetadata = {
        ...(settlement.metadata || {}),
    };

    let note = reason;
    if (settlement.released_to_wallet_at && reversalAmount > 0) {
        await walletService.withdraw(
            settlement.seller_user_id,
            reversalAmount,
            `Settlement reversal for order ${order?.uuid || orderId}`,
            { session, allowNegative: true }
        );
        nextMetadata.sellerWalletReversal = {
            status: 'COMPLETED',
            amount: reversalAmount,
            reversedAt: new Date(),
        };
        note = `${reason}. Seller wallet reversed automatically.`;
    }

    await platformLedgerService.reversePlatformFeeForSettlement(settlement, reason, { session });
    settlement.status = 'refunded';
    settlement.notes = note;
    settlement.metadata = nextMetadata;
    await settlement.save(session ? { session } : {});
    return settlement;
};

const getSellerSettlementSummary = async (sellerUserId, options = {}) => {
    const { session } = options;
    const aggregate = Settlement.aggregate([
        {
            $match: {
                seller_user_id: sellerUserId,
                status: { $in: ['pending', 'available'] },
            },
        },
        {
            $group: {
                _id: '$status',
                total: { $sum: '$net_amount' },
            },
        },
    ]);

    if (session) {
        aggregate.session(session);
    }

    const rows = await aggregate;
    return rows.reduce(
        (summary, row) => {
            if (row._id === 'pending') {
                summary.pendingBalance = Number(row.total || 0);
            }
            if (row._id === 'available') {
                summary.releasedBalance = Number(row.total || 0);
            }
            return summary;
        },
        { pendingBalance: 0, releasedBalance: 0 }
    );
};

module.exports = {
    buildSettlementAmounts,
    createSettlementForPaidOrder,
    releaseSettlementToWallet,
    cancelSettlementForOrder,
    refundSettlementForOrder,
    getSellerSettlementSummary,
};
