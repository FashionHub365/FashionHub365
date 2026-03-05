const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { paymentService } = require('../services');

const callback = catchAsync(async (req, res) => {
    const configuredSecret = config.payment.bankTransferWebhookSecret;
    if (configuredSecret) {
        const providedSecret = req.headers['x-webhook-secret'];
        if (providedSecret !== configuredSecret) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook secret');
        }
    }

    const processed = await paymentService.processBankTransferCallback(req.body);
    res.send({
        success: true,
        data: {
            processed,
        },
    });
});

const health = catchAsync(async (req, res) => {
    res.send({
        success: true,
        data: {
            status: 'ok',
        },
    });
});

module.exports = {
    callback,
    health,
};
