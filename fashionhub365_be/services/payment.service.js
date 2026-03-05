const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Order, Payment, PaymentMethod } = require('../models');

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

    return payment;
};

const createPayment = async (payload) => {
    const payment = await createBasePayment(payload);
    return toPaymentResponse(payment);
};

const markPaymentPaid = async (payment, meta = {}) => {
    if (payment.status === 'PAID') {
        return payment;
    }

    payment.status = 'PAID';
    payment.paid_at = new Date();
    if (meta.rawPayload) {
        payment.raw_payload = JSON.stringify(meta.rawPayload);
    }
    if (meta.providerTxnId || meta.amount) {
        payment.transactions.push({
            providerTxnId: meta.providerTxnId || payment.transaction_id,
            amount: meta.amount || payment.amount,
            status: 'PAID',
        });
    }
    await payment.save();

    const order = await Order.findById(payment.order_id);
    if (order) {
        order.payment_status = 'paid';
        if (order.status === 'created') {
            order.status = 'confirmed';
        }
        await order.save();
    }

    return payment;
};

const markPaymentFailed = async (payment, meta = {}) => {
    if (payment.status !== 'PENDING') {
        return payment;
    }

    payment.status = 'FAILED';
    payment.failed_at = new Date();
    if (meta.rawPayload) {
        payment.raw_payload = JSON.stringify(meta.rawPayload);
    }
    payment.transactions.push({
        providerTxnId: meta.providerTxnId || payment.transaction_id,
        amount: meta.amount || payment.amount,
        status: 'FAILED',
    });
    await payment.save();

    const order = await Order.findById(payment.order_id);
    if (order && order.payment_status === 'unpaid') {
        order.payment_status = 'failed';
        await order.save();
    }

    return payment;
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

    const order = await ensurePaymentOwnership(payment, userId);

    if (payment.status !== 'PENDING') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending payments can be cancelled');
    }

    payment.status = 'CANCELLED';
    payment.cancelled_at = new Date();
    payment.transactions.push({
        providerTxnId: transactionId,
        amount: payment.amount,
        status: 'CANCELLED',
    });
    payment.raw_payload = JSON.stringify({
        ...(payment.raw_payload ? JSON.parse(payment.raw_payload) : {}),
        cancelReason: reason,
    });
    await payment.save();

    if (order && order.payment_status === 'unpaid') {
        order.payment_status = 'failed';
        await order.save();
    }

    return payment;
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

        await markPaymentPaid(payment, {
            providerTxnId,
            amount,
            rawPayload: payload,
        });

        processed.push({
            paymentUuid: payment.uuid,
            transactionId,
            status: payment.status,
        });
    }

    return processed;
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
};
