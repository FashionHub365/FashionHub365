const crypto = require('crypto');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { Order, Payment, PaymentMethod, User } = require('../models');
const emailService = require('./email.service');
const { runWithTransaction } = require('../utils/transaction');
const stockReservationService = require('./stockReservation.service');
const outboxService = require('./outbox.service');
const settlementService = require('./settlement.service');

const DEFAULT_BANK_INFO = {
    bank_name: 'FashionHub365 Bank',
    account_name: 'FASHIONHUB365',
    account_number: '0000000000',
    bin: '970000',
};

const PAYMENT_METHOD_CODES = ['BANK_TRANSFER', 'QR_TRANSFER', 'VNPAY', 'MOMO'];

const buildTransactionId = () => `PAY${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const buildTransferContent = (transactionId) => `FASHIONHUB ${transactionId}`;

const buildQrCodePayload = ({ bankInfo, amount, transferContent }) => {
    return JSON.stringify({
        bankName: bankInfo.bank_name,
        accountName: bankInfo.account_name,
        accountNumber: bankInfo.account_number,
        bin: bankInfo.bin,
        amount,
        transferContent,
    });
};

const toPaymentMethodResponse = (method) => ({
    code: method.code || method.type || method.name,
    name: method.name,
    type: method.type,
    enabled: method.enabled,
    config: method.config || {},
});

const resolvePaymentMethod = async (paymentMethodCode) => {
    const normalizedCode = paymentMethodCode.toUpperCase();
    if (!PAYMENT_METHOD_CODES.includes(normalizedCode)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported payment method');
    }

    const method = await PaymentMethod.findOne({
        $or: [{ code: normalizedCode }, { type: normalizedCode }, { name: normalizedCode }],
        enabled: true,
    });

    return { normalizedCode, method };
};

const getEnabledPaymentMethods = async () => {
    const methods = await PaymentMethod.find({ enabled: true }).sort({ created_at: 1 });
    return methods.map(toPaymentMethodResponse);
};

const getAllPaymentMethods = async () => {
    const methods = await PaymentMethod.find().sort({ created_at: 1 });
    return methods.map(toPaymentMethodResponse);
};

const getPaymentMethodByCode = async (code) => {
    const normalizedCode = code.toUpperCase();
    const method = await PaymentMethod.findOne({
        $or: [{ code: normalizedCode }, { type: normalizedCode }, { name: normalizedCode }],
    });

    if (!method) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
    }

    return toPaymentMethodResponse(method);
};

const getOrderByUuid = async (orderUuid) => {
    const order = await Order.findOne({ uuid: orderUuid });
    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    return order;
};

const ensureOrderOwnership = (order, userId) => {
    if (userId && order.user_id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this order');
    }
};

const ensurePaymentOwnership = async (payment, userId) => {
    if (!userId) {
        return;
    }

    const order = await Order.findById(payment.order_id);
    if (!order || order.user_id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this payment');
    }

    return order;
};

const countOpenPaymentsForOrder = async (orderId, options = {}) => {
    const { session, excludePaymentId } = options;
    const query = {
        order_id: orderId,
        status: { $in: ['PENDING', 'PAID'] },
    };
    if (excludePaymentId) {
        query._id = { $ne: excludePaymentId };
    }

    const countQuery = Payment.countDocuments(query);
    if (session) {
        countQuery.session(session);
    }
    return countQuery;
};

const ensureOrderCanCreatePayment = (order, amount, currency) => {
    if (order.payment_status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Order has already been paid');
    }

    if (['cancelled', 'refunded'].includes(order.status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Order is not available for payment');
    }

    if (amount !== order.total_amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount does not match order total');
    }

    if (currency !== order.currency) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment currency does not match order currency');
    }
};

const toPaymentResponse = (payment) => ({
    paymentUuid: payment.uuid,
    transactionId: payment.transaction_id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    qrCode: payment.status === 'PENDING'
        ? buildQrCodePayload({
            bankInfo: payment.bank_info,
            amount: payment.amount,
            transferContent: payment.transfer_content,
        })
        : null,
    transferContent: payment.transfer_content,
    bankInfo: payment.bank_info,
    paidAt: payment.paid_at,
});

const createBasePayment = async (payload) => {
    const { orderId, paymentMethodCode, amount, currency = 'VND', userId, rawPayload = {}, provider, extra = {} } = payload;
    const order = await getOrderByUuid(orderId);
    ensureOrderOwnership(order, userId);
    ensureOrderCanCreatePayment(order, amount, currency);

    const { normalizedCode, method } = await resolvePaymentMethod(paymentMethodCode);
    const transactionId = buildTransactionId();
    const transferContent = buildTransferContent(transactionId);
    const expiresAt = new Date(Date.now() + Number(config.payment.pendingTtlMinutes || 15) * 60 * 1000);

    const payment = await Payment.create({
        order_id: order._id,
        payment_method_id: method?._id,
        store_id: order.store_id,
        method: normalizedCode,
        provider: provider || normalizedCode,
        transaction_id: transactionId,
        amount,
        currency,
        status: 'PENDING',
        expires_at: extra.expires_at || expiresAt,
        bank_info: {
            ...DEFAULT_BANK_INFO,
            ...(method?.config?.bankInfo || {}),
        },
        transfer_content: transferContent,
        raw_payload: JSON.stringify({
            orderUuid: order.uuid,
            paymentMethodCode: normalizedCode,
            ...rawPayload,
        }),
        transactions: [{
            providerTxnId: transactionId,
            amount,
            status: 'PENDING',
        }],
        ...extra,
    });

    if (order.payment_status !== 'unpaid') {
        order.payment_status = 'unpaid';
    }
    if (order.status === 'created') {
        order.status_history.push({
            oldStatus: 'created',
            newStatus: 'pending_payment',
            changedBy: 'system',
            note: 'Waiting for payment gateway confirmation',
        });
        order.status = 'pending_payment';
    }
    if (order.isModified()) {
        await order.save();
    }

    return payment;
};

const createPayment = async (payload) => {
    const payment = await createBasePayment(payload);
    return toPaymentResponse(payment);
};

const markPaymentPaid = async (payment, meta = {}) => {
    return runWithTransaction(async (session) => {
        const lockedPayment = await Payment.findById(payment._id).session(session || null);
        if (!lockedPayment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
        }
        if (!['PENDING', 'PAID'].includes(lockedPayment.status)) {
            return lockedPayment;
        }

        if (lockedPayment.status === 'PENDING') {
            lockedPayment.status = 'PAID';
            lockedPayment.paid_at = new Date();
            if (meta.rawPayload) {
                lockedPayment.raw_payload = JSON.stringify(meta.rawPayload);
            }
            if (meta.providerTxnId || meta.amount) {
                lockedPayment.transactions.push({
                    providerTxnId: meta.providerTxnId || lockedPayment.transaction_id,
                    amount: meta.amount || lockedPayment.amount,
                    status: 'PAID',
                });
            }
            await lockedPayment.save({ session });
        }

        const order = await Order.findById(lockedPayment.order_id).session(session || null);
        if (order) {
            if (['cancelled', 'refunded'].includes(order.status) && order.payment_status !== 'paid') {
                order.payment_status = 'paid';
                order.status_history.push({
                    oldStatus: order.status,
                    newStatus: order.status,
                    changedBy: 'system',
                    note: 'Late payment received after order cancellation. Manual review or refund may be required.',
                });
                await order.save({ session });
                return lockedPayment;
            }

            order.payment_status = 'paid';
            if (['created', 'pending_payment'].includes(order.status)) {
                const oldStatus = order.status;
                order.status = 'confirmed';
                order.status_history.push({
                    oldStatus,
                    newStatus: 'confirmed',
                    changedBy: 'system',
                    note: 'Payment confirmed by gateway callback',
                });
            }
            await order.save({ session });
            await stockReservationService.confirmReservationsForOrder(order._id, { session });
            await settlementService.createSettlementForPaidOrder(order._id, lockedPayment._id, { session });
            await outboxService.enqueueEventIfNotExists(
                {
                    aggregateType: 'ORDER',
                    aggregateId: order._id.toString(),
                    eventType: 'ORDER_CONFIRMED',
                    payload: {
                        orderId: order._id.toString(),
                        orderUuid: order.uuid,
                        userId: order.user_id.toString(),
                    },
                },
                { session }
            );
        }

        return lockedPayment;
    });
};

const markPaymentFailed = async (payment, meta = {}) => {
    return runWithTransaction(async (session) => {
        const lockedPayment = await Payment.findById(payment._id).session(session || null);
        if (!lockedPayment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
        }
        if (lockedPayment.status !== 'PENDING') {
            return lockedPayment;
        }

        lockedPayment.status = 'FAILED';
        lockedPayment.failed_at = new Date();
        if (meta.rawPayload) {
            lockedPayment.raw_payload = JSON.stringify(meta.rawPayload);
        }
        lockedPayment.transactions.push({
            providerTxnId: meta.providerTxnId || lockedPayment.transaction_id,
            amount: meta.amount || lockedPayment.amount,
            status: 'FAILED',
        });
        await lockedPayment.save({ session });

        const order = await Order.findById(lockedPayment.order_id).session(session || null);
        if (order && order.payment_status !== 'paid') {
            const remainingOpenPayments = await countOpenPaymentsForOrder(lockedPayment.order_id, {
                session,
                excludePaymentId: lockedPayment._id,
            });

            if (remainingOpenPayments === 0) {
                order.payment_status = 'failed';
                if (['created', 'pending_payment'].includes(order.status)) {
                    const oldStatus = order.status;
                    order.status = 'cancelled';
                    order.status_history.push({
                        oldStatus,
                        newStatus: 'cancelled',
                        changedBy: 'system',
                        note: 'Payment failed or cancelled by user',
                    });

                    await stockReservationService.releaseReservationsForOrder(order._id, {
                        session,
                        reason: 'PAYMENT_FAILED',
                    });

                    // Send cancellation email
                    const user = await User.findById(order.user_id).session(session || null);
                    if (user && user.email) {
                        // We use setImmediate or just fire and forget after session commit might be better, 
                        // but let's do it simple for now or better, after the transaction.
                        // Actually, emails should be sent after session is committed to be safe.
                        // However, the current pattern doesn't easily support post-commit hooks here.
                        // I'll use setImmediate to send it asynchronously.
                        setImmediate(() => {
                            emailService.sendOrderCancelledEmail(user.email, order, 'Thanh toán thất bại hoặc bị hủy bởi người dùng');
                        });
                    }
                }
            } else {
                order.payment_status = 'unpaid';
            }
            await order.save({ session });
        }

        return lockedPayment;
    });
};

const getPaymentStatus = async (paymentUuid, userId) => {
    const payment = await Payment.findOne({ uuid: paymentUuid });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    await ensurePaymentOwnership(payment, userId);

    return {
        paymentUuid: payment.uuid,
        transactionId: payment.transaction_id,
        status: payment.status,
        paidAt: payment.paid_at,
    };
};

const getPaymentDetail = async (paymentUuid, userId) => {
    const payment = await Payment.findOne({ uuid: paymentUuid })
        .populate('order_id')
        .populate('payment_method_id');

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (userId && payment.order_id?.user_id?.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this payment');
    }

    return payment;
};

const getPaymentByTransactionId = async (transactionId, userId) => {
    const payment = await Payment.findOne({ transaction_id: transactionId });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    await ensurePaymentOwnership(payment, userId);

    return payment;
};

const cancelPayment = async (transactionId, reason, userId) => {
    const payment = await Payment.findOne({ transaction_id: transactionId });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    await ensurePaymentOwnership(payment, userId);

    return runWithTransaction(async (session) => {
        const lockedPayment = await Payment.findOne({
            _id: payment._id,
        }).session(session || null);
        if (!lockedPayment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
        }
        if (lockedPayment.status !== 'PENDING') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending payments can be cancelled');
        }

        lockedPayment.status = 'CANCELLED';
        lockedPayment.cancelled_at = new Date();
        lockedPayment.transactions.push({
            providerTxnId: transactionId,
            amount: lockedPayment.amount,
            status: 'CANCELLED',
        });
        let parsedRawPayload = {};
        try {
            parsedRawPayload = lockedPayment.raw_payload ? JSON.parse(lockedPayment.raw_payload) : {};
        } catch (error) {
            parsedRawPayload = {};
        }
        lockedPayment.raw_payload = JSON.stringify({
            ...parsedRawPayload,
            cancelReason: reason,
        });
        await lockedPayment.save({ session });

        const order = await Order.findById(lockedPayment.order_id).session(session || null);
        if (order && order.payment_status !== 'paid') {
            const remainingOpenPayments = await countOpenPaymentsForOrder(order._id, {
                session,
                excludePaymentId: lockedPayment._id,
            });

            if (remainingOpenPayments === 0) {
                order.payment_status = 'failed';
                if (order.status === 'pending_payment') {
                    const oldStatus = order.status;
                    order.status = 'cancelled';
                    order.status_history.push({
                        oldStatus,
                        newStatus: 'cancelled',
                        changedBy: 'customer',
                        note: reason || 'Payment cancelled by user',
                    });
                }
                await stockReservationService.releaseReservationsForOrder(order._id, {
                    session,
                    reason: 'PAYMENT_CANCELLED_BY_USER',
                    nextStatus: 'RELEASED',
                });
            } else {
                order.payment_status = 'unpaid';
            }

            await order.save({ session });
        }

        return lockedPayment;
    });
};

const normalizeBankTransferItems = (payload) => {
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }
    if (Array.isArray(payload?.transactions)) {
        return payload.transactions;
    }
    return [payload];
};

const processBankTransferCallback = async (payload) => {
    const items = normalizeBankTransferItems(payload);
    const processed = [];

    for (const item of items) {
        const amount = Number(item.amount || item.transferAmount || 0);
        if (!(amount > 0)) {
            continue;
        }

        const description = `${item.description || item.content || ''}`;
        const match = description.match(/PAY\d+[A-Z0-9]+/i);
        if (!match) {
            continue;
        }

        const transactionId = match[0].toUpperCase();
        const payment = await Payment.findOne({ transaction_id: transactionId });
        if (!payment || payment.status === 'PAID') {
            continue;
        }

        const providerTxnId = `${item.id || item.reference || transactionId}`;
        const alreadyProcessed = payment.transactions.some((txn) => txn.providerTxnId === providerTxnId && txn.status === 'PAID');
        if (alreadyProcessed) {
            continue;
        }

        if (Number(payment.amount) !== amount) {
            continue;
        }

        const updatedPayment = await markPaymentPaid(payment, {
            providerTxnId,
            amount,
            rawPayload: payload,
        });

        processed.push({
            paymentUuid: updatedPayment.uuid,
            transactionId,
            status: updatedPayment.status,
        });
    }

    return processed;
};

const expirePendingPayments = async (options = {}) => {
    const { limit = 200, now = new Date() } = options;
    const stalePayments = await Payment.find({
        status: 'PENDING',
        expires_at: { $lte: now },
    })
        .sort({ expires_at: 1 })
        .limit(limit);

    let expiredCount = 0;
    for (const payment of stalePayments) {
        const failed = await markPaymentFailed(payment, {
            providerTxnId: payment.transaction_id,
            amount: payment.amount,
            rawPayload: { reconcile: 'PAYMENT_EXPIRED' },
        });

        if (failed.status !== 'FAILED') {
            continue;
        }

        const remainingPendingOrPaid = await Payment.countDocuments({
            order_id: failed.order_id,
            status: { $in: ['PENDING', 'PAID'] },
        });

        if (remainingPendingOrPaid === 0) {
            await runWithTransaction(async (session) => {
                const order = await Order.findById(failed.order_id).session(session || null);
                if (!order || order.payment_status === 'paid') {
                    return;
                }

                await stockReservationService.releaseReservationsForOrder(order._id, {
                    session,
                    reason: 'PAYMENT_EXPIRED_RECONCILE',
                    nextStatus: 'EXPIRED',
                });

                if (order.status === 'pending_payment') {
                    order.status_history.push({
                        oldStatus: 'pending_payment',
                        newStatus: 'cancelled',
                        changedBy: 'system',
                        note: 'Auto-cancelled due to payment timeout',
                    });
                    order.status = 'cancelled';
                }
                order.payment_status = 'failed';
                await order.save({ session });
            });
        }

        expiredCount += 1;
    }

    return { expiredCount };
};

const repairPaidPaymentOrderState = async (options = {}) => {
    const { limit = 200 } = options;
    const paidPayments = await Payment.find({ status: 'PAID' })
        .sort({ created_at: -1 })
        .limit(limit);

    let repairedCount = 0;
    for (const payment of paidPayments) {
        const order = await Order.findById(payment.order_id);
        if (!order) {
            continue;
        }
        if (order.payment_status !== 'paid' || ['pending_payment', 'created'].includes(order.status)) {
            await markPaymentPaid(payment, {
                providerTxnId: payment.transaction_id,
                amount: payment.amount,
                rawPayload: { reconcile: 'PAID_STATE_REPAIR' },
            });
            repairedCount += 1;
        }
    }

    return { repairedCount };
};

module.exports = {
    createBasePayment,
    createPayment,
    getEnabledPaymentMethods,
    getAllPaymentMethods,
    getPaymentMethodByCode,
    markPaymentPaid,
    markPaymentFailed,
    getPaymentStatus,
    getPaymentDetail,
    getPaymentByTransactionId,
    cancelPayment,
    processBankTransferCallback,
    expirePendingPayments,
    repairPaidPaymentOrderState,
};
