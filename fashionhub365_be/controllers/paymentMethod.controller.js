const catchAsync = require('../utils/catchAsync');
const { paymentService } = require('../services');

const getEnabledPaymentMethods = catchAsync(async (req, res) => {
    const methods = await paymentService.getEnabledPaymentMethods();
    res.send({
        success: true,
        data: { methods },
    });
});

const getPaymentMethods = catchAsync(async (req, res) => {
    const methods = await paymentService.getAllPaymentMethods();
    res.send({
        success: true,
        data: { methods },
    });
});

const getPaymentMethod = catchAsync(async (req, res) => {
    const method = await paymentService.getPaymentMethodByCode(req.params.code);
    res.send({
        success: true,
        data: { method },
    });
});

module.exports = {
    getEnabledPaymentMethods,
    getPaymentMethods,
    getPaymentMethod,
};
