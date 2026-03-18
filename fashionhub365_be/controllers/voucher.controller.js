const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const voucherService = require('../services/voucher.service');

const createVoucher = catchAsync(async (req, res) => {
    const result = await voucherService.createVoucher(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: result });
});

const getVouchers = catchAsync(async (req, res) => {
    const result = await voucherService.getVouchers(req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getVoucherById = catchAsync(async (req, res) => {
    const result = await voucherService.getVoucherById(req.params.id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const updateVoucher = catchAsync(async (req, res) => {
    const result = await voucherService.updateVoucher(req.params.id, req.body);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteVoucher = catchAsync(async (req, res) => {
    await voucherService.deleteVoucher(req.params.id);
    res.status(httpStatus.OK).send({ success: true, message: 'Voucher deleted' });
});

const applyVoucher = catchAsync(async (req, res) => {
    const { code, orderAmount } = req.body;
    const result = await voucherService.applyVoucher(code, req.user._id, orderAmount);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { createVoucher, getVouchers, getVoucherById, updateVoucher, deleteVoucher, applyVoucher };
