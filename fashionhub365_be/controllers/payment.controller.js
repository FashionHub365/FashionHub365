const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { paymentService } = require('../services');

const createPayment = catchAsync(async (req, res) => {
    const payment = await paymentService.createPayment({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user._id,
    });

    res.status(httpStatus.CREATED).send({
        success: true,
        data: payment,
    });
});

const getPaymentStatus = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentStatus(req.params.paymentUuid, req.user._id);
    res.send({
        success: true,
        data: payment,
    });
});

const getPaymentDetail = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentDetail(req.params.paymentUuid, req.user._id);
    res.send({
        success: true,
        data: { payment },
    });
});

const getPaymentByTransactionId = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentByTransactionId(req.params.transactionId, req.user._id);
    res.send({
        success: true,
        data: { payment },
    });
});

const cancelPayment = catchAsync(async (req, res) => {
    const payment = await paymentService.cancelPayment(req.params.transactionId, req.query.reason, req.user._id);
    res.send({
        success: true,
        data: {
            paymentUuid: payment.uuid,
            transactionId: payment.transaction_id,
            status: payment.status,
        },
    });
});

module.exports = {
    createPayment,
    getPaymentStatus,
    getPaymentDetail,
    getPaymentByTransactionId,
    cancelPayment,
};
