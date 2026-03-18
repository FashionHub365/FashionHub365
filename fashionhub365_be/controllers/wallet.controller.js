const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const walletService = require('../services/wallet.service');

const getBalance = catchAsync(async (req, res) => {
    const result = await walletService.getBalance(req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getTransactions = catchAsync(async (req, res) => {
    const result = await walletService.getTransactions(req.user._id, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const requestPayout = catchAsync(async (req, res) => {
    const { storeId, amount } = req.body;
    const result = await walletService.requestPayout(storeId, amount);
    res.status(httpStatus.CREATED).send({ success: true, data: result });
});

const getPayouts = catchAsync(async (req, res) => {
    const storeId = req.params.storeId || req.storeId;
    const result = await walletService.getPayouts(storeId, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const processPayout = catchAsync(async (req, res) => {
    const { status } = req.body;
    const result = await walletService.processPayout(req.params.id, status);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { getBalance, getTransactions, requestPayout, getPayouts, processPayout };
