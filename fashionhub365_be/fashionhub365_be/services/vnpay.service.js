const crypto = require('crypto');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { Payment } = require('../models');
const paymentService = require('./payment.service');

const VNPAY_PAYMENT_METHOD_CODE = 'VNPAY';
const DATE_TIME_ZONE = 'Asia/Bangkok';

const formatDate = (date) => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: DATE_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
};

const sortObject = (input) => {
    return Object.keys(input)
        .sort()
        .reduce((result, key) => {
            if (input[key] !== undefined && input[key] !== null && input[key] !== '') {
                result[key] = input[key];
            }
            return result;
        }, {});
};

const buildQueryString = (params) => {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
        .join('&');
};

const buildSecureHash = (params) => {
    const sortedParams = sortObject(params);
    const signData = buildQueryString(sortedParams);
    return crypto
        .createHmac('sha512', config.payment.vnpay.hashSecret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
};

const ensureVNPayConfig = () => {
    const { tmnCode, hashSecret, url } = config.payment.vnpay;
    if (!tmnCode || !hashSecret || !url) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'VNPay configuration is incomplete');
    }
};

const readRawPayload = (payment) => {
    try {
        return payment.raw_payload ? JSON.parse(payment.raw_payload) : {};
    } catch (error) {
        return {};
    }
};

const createVNPayPayment = async (payload) => {
    ensureVNPayConfig();

    const payment = await paymentService.createBasePayment({
        ...payload,
        paymentMethodCode: VNPAY_PAYMENT_METHOD_CODE,
        provider: VNPAY_PAYMENT_METHOD_CODE,
        rawPayload: {
            frontendReturnUrl: payload.returnUrl || null,
            locale: payload.locale || 'vn',
            bankCode: payload.bankCode || null,
        },
    });

    const createDate = formatDate(new Date());
    const expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000));
    const vnPayReturnUrl = config.payment.vnpay.returnUrl;
    if (!vnPayReturnUrl) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'VNPAY_RETURN_URL is required');
    }

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.payment.vnpay.tmnCode,
        vnp_Locale: payload.locale || 'vn',
        vnp_CurrCode: payment.currency,
        vnp_TxnRef: payment.transaction_id,
        vnp_OrderInfo: payment.transfer_content,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(payment.amount * 100),
        vnp_ReturnUrl: vnPayReturnUrl,
        vnp_IpAddr: payload.ipAddress || '127.0.0.1',
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    if (payload.bankCode) {
        params.vnp_BankCode = payload.bankCode;
    }

    const secureHash = buildSecureHash(params);
    const paymentUrl = `${config.payment.vnpay.url}?${buildQueryString({
        ...sortObject(params),
        vnp_SecureHash: secureHash,
    })}`;

    payment.raw_payload = JSON.stringify({
        ...(payment.raw_payload ? JSON.parse(payment.raw_payload) : {}),
        createDate,
        expireDate,
        paymentUrl,
    });
    await payment.save();

    return {
        paymentUuid: payment.uuid,
        transactionId: payment.transaction_id,
        status: payment.status,
        paymentUrl,
    };
};

const processVNPayCallback = async (query) => {
    ensureVNPayConfig();

    const params = { ...query };
    const providedHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const expectedHash = buildSecureHash(params);
    if (expectedHash !== providedHash) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid VNPay signature');
    }

    const transactionId = params.vnp_TxnRef;
    const payment = await Payment.findOne({ transaction_id: transactionId });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (params.vnp_TmnCode !== config.payment.vnpay.tmnCode) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid VNPay terminal code');
    }

    const callbackAmount = Number(params.vnp_Amount || 0) / 100;
    if (callbackAmount !== Number(payment.amount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid VNPay amount');
    }

    if (params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00') {
        await paymentService.markPaymentPaid(payment, {
            providerTxnId: params.vnp_TransactionNo || transactionId,
            amount: callbackAmount || payment.amount,
            rawPayload: query,
        });
    } else {
        await paymentService.markPaymentFailed(payment, {
            providerTxnId: params.vnp_TransactionNo || transactionId,
            amount: callbackAmount || payment.amount,
            rawPayload: query,
        });
    }

    const latestPayment = await Payment.findOne({ transaction_id: transactionId });
    const rawPayload = readRawPayload(latestPayment);
    return {
        paymentUuid: latestPayment.uuid,
        transactionId: latestPayment.transaction_id,
        status: latestPayment.status,
        responseCode: params.vnp_ResponseCode,
        frontendReturnUrl: rawPayload.frontendReturnUrl || `${config.frontendUrl}/payment-result`,
    };
};

const queryVNPayPayment = async (transactionId, userId) => {
    const payment = await paymentService.getPaymentByTransactionId(transactionId, userId);
    return {
        paymentUuid: payment.uuid,
        transactionId: payment.transaction_id,
        status: payment.status,
        paidAt: payment.paid_at,
        failedAt: payment.failed_at,
    };
};

module.exports = {
    createVNPayPayment,
    processVNPayCallback,
    queryVNPayPayment,
};
