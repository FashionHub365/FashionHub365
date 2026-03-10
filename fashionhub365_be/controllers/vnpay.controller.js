const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { vnpayService } = require('../services');

const createVNPayPayment = catchAsync(async (req, res) => {
    const payment = await vnpayService.createVNPayPayment({
        ...req.body,
        userId: req.user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
    });

    res.status(httpStatus.CREATED).send({
        success: true,
        data: payment,
    });
});

const callback = catchAsync(async (req, res) => {
    // Process callback here as well to avoid pending orders when IPN is delayed/missing.
    const result = await vnpayService.processVNPayCallback(req.query);
    const redirectUrl = new URL(result.frontendReturnUrl);
    redirectUrl.searchParams.set('paymentUuid', result.paymentUuid);
    redirectUrl.searchParams.set('transactionId', result.transactionId);
    redirectUrl.searchParams.set('status', result.status);
    redirectUrl.searchParams.set('responseCode', result.responseCode);
    res.redirect(redirectUrl.toString());
});

const ipn = catchAsync(async (req, res) => {
    try {
        const result = await vnpayService.processVNPayCallback(req.query);
        res.send({
            RspCode: '00',
            Message: 'Confirm Success',
            paymentUuid: result.paymentUuid,
            transactionId: result.transactionId,
            status: result.status,
        });
    } catch (error) {
        const statusMap = {
            'Missing VNPay signature': { RspCode: '97', Message: 'Invalid Checksum' },
            'Invalid VNPay signature': { RspCode: '97', Message: 'Invalid Checksum' },
            'Payment not found': { RspCode: '01', Message: 'Order not Found' },
            'Invalid VNPay amount': { RspCode: '04', Message: 'Invalid Amount' },
            'Invalid VNPay terminal code': { RspCode: '97', Message: 'Invalid Checksum' },
        };
        const mapped = statusMap[error.message] || { RspCode: '99', Message: 'Unknown Error' };
        res.status(200).send(mapped);
    }
});

const queryPayment = catchAsync(async (req, res) => {
    const payment = await vnpayService.queryVNPayPayment(req.params.transactionId, req.user?._id);
    res.send({
        success: true,
        data: payment,
    });
});

module.exports = {
    createVNPayPayment,
    callback,
    ipn,
    queryPayment,
};
