const Joi = require('joi');

const createPayment = {
    body: Joi.object().keys({
        orderId: Joi.string().required(),
        paymentMethodCode: Joi.string().required().uppercase(),
        amount: Joi.number().positive().required(),
        currency: Joi.string().default('VND'),
        returnUrl: Joi.string().uri().allow('', null),
    }),
};

const createVNPayPayment = {
    body: Joi.object().keys({
        orderId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        currency: Joi.string().default('VND'),
        bankCode: Joi.string().allow('', null),
        locale: Joi.string().valid('vn', 'en').default('vn'),
        returnUrl: Joi.string().uri().allow('', null),
    }),
};

const vnpayCallback = {
    query: Joi.object().unknown(true),
};

const getPaymentStatus = {
    params: Joi.object().keys({
        paymentUuid: Joi.string().required(),
    }),
};

const getPaymentDetail = {
    params: Joi.object().keys({
        paymentUuid: Joi.string().required(),
    }),
};

const getPaymentByTransactionId = {
    params: Joi.object().keys({
        transactionId: Joi.string().required(),
    }),
};

const cancelPayment = {
    params: Joi.object().keys({
        transactionId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        reason: Joi.string().allow('', null).default('Cancelled by user'),
    }),
};

const bankTransferCallback = {
    body: Joi.object().unknown(true),
};

module.exports = {
    createPayment,
    createVNPayPayment,
    vnpayCallback,
    getPaymentStatus,
    getPaymentDetail,
    getPaymentByTransactionId,
    cancelPayment,
    bankTransferCallback,
};
