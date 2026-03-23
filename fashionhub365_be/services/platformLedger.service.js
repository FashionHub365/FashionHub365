const { PlatformLedgerEntry } = require('../models');

const normalizeSessionOptions = (session) => (session ? { session } : {});

const buildSignedAmountExpression = {
    $cond: [
        { $eq: ['$direction', 'DEBIT'] },
        { $multiply: ['$amount', -1] },
        '$amount',
    ],
};

const recordPlatformFeeForSettlement = async (settlement, options = {}) => {
    const { session } = options;
    const amount = Number(settlement?.platform_fee_amount || 0);
    if (!settlement?.order_id || amount <= 0) {
        return null;
    }

    return PlatformLedgerEntry.findOneAndUpdate(
        {
            order_id: settlement.order_id,
            entry_type: 'FEE_RECOGNIZED',
        },
        {
            $set: {
                settlement_id: settlement._id,
                payment_id: settlement.payment_id || null,
                store_id: settlement.store_id,
                seller_user_id: settlement.seller_user_id,
                direction: 'CREDIT',
                amount,
                currency: settlement.currency || 'VND',
                notes: `Platform fee recognized for order ${settlement.order_id}`,
                metadata: {
                    settlementStatus: settlement.status,
                    netAmount: settlement.net_amount,
                    shippingAmount: settlement.shipping_amount,
                    discountAmount: settlement.discount_amount,
                },
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            ...normalizeSessionOptions(session),
        }
    );
};

const reversePlatformFeeForSettlement = async (settlement, reason = 'Platform fee reversed', options = {}) => {
    const { session } = options;
    const amount = Number(settlement?.platform_fee_amount || 0);
    if (!settlement?.order_id || amount <= 0) {
        return null;
    }

    return PlatformLedgerEntry.findOneAndUpdate(
        {
            order_id: settlement.order_id,
            entry_type: 'FEE_REVERSED',
        },
        {
            $set: {
                settlement_id: settlement._id,
                payment_id: settlement.payment_id || null,
                store_id: settlement.store_id,
                seller_user_id: settlement.seller_user_id,
                direction: 'DEBIT',
                amount,
                currency: settlement.currency || 'VND',
                notes: reason,
                metadata: {
                    settlementStatus: settlement.status,
                    reversedFromSettlementId: settlement._id,
                },
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            ...normalizeSessionOptions(session),
        }
    );
};

const getPlatformLedgerSummary = async (options = {}) => {
    const { from, to, session } = options;
    const match = {};
    if (from || to) {
        match.created_at = {};
        if (from) {
            match.created_at.$gte = from;
        }
        if (to) {
            match.created_at.$lte = to;
        }
    }

    const aggregate = PlatformLedgerEntry.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                recognizedRevenue: {
                    $sum: {
                        $cond: [{ $eq: ['$entry_type', 'FEE_RECOGNIZED'] }, '$amount', 0],
                    },
                },
                reversedRevenue: {
                    $sum: {
                        $cond: [{ $eq: ['$entry_type', 'FEE_REVERSED'] }, '$amount', 0],
                    },
                },
                netRevenue: { $sum: buildSignedAmountExpression },
            },
        },
    ]);

    if (session) {
        aggregate.session(session);
    }

    const [summary] = await aggregate;
    return {
        recognizedRevenue: Number(summary?.recognizedRevenue || 0),
        reversedRevenue: Number(summary?.reversedRevenue || 0),
        netRevenue: Number(summary?.netRevenue || 0),
    };
};

const getMonthlyPlatformLedgerSummary = async (options = {}) => {
    const { from, session } = options;
    const match = {};
    if (from) {
        match.created_at = { $gte: from };
    }

    const aggregate = PlatformLedgerEntry.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    year: { $year: '$created_at' },
                    month: { $month: '$created_at' },
                },
                recognizedRevenue: {
                    $sum: {
                        $cond: [{ $eq: ['$entry_type', 'FEE_RECOGNIZED'] }, '$amount', 0],
                    },
                },
                reversedRevenue: {
                    $sum: {
                        $cond: [{ $eq: ['$entry_type', 'FEE_REVERSED'] }, '$amount', 0],
                    },
                },
                netRevenue: { $sum: buildSignedAmountExpression },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    if (session) {
        aggregate.session(session);
    }

    return aggregate;
};

module.exports = {
    recordPlatformFeeForSettlement,
    reversePlatformFeeForSettlement,
    getPlatformLedgerSummary,
    getMonthlyPlatformLedgerSummary,
};
