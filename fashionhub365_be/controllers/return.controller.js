const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { orderService } = require('../services');
const { Return } = require('../models');
const ApiError = require('../utils/ApiError');

const requestReturn = catchAsync(async (req, res) => {
    const { orderId, reason } = req.body;
    const returnReq = await orderService.requestReturn(req.user._id, orderId, reason);
    res.status(httpStatus.CREATED).send({ success: true, data: { return: returnReq } });
});

const getMyReturns = catchAsync(async (req, res) => {
    // Basic implementation for customer to see their returns
    const returns = await Return.find().populate({
        path: 'order_id',
        match: { user_id: req.user._id }
    });
    // Filter out nulls if populated with match
    const filtered = returns.filter(r => r.order_id);
    res.send({ success: true, data: { returns: filtered } });
});

const getStoreReturns = catchAsync(async (req, res) => {
    // Seller view of returns for their store
    // Assuming seller has role check in route
    const returns = await Return.find().populate({
        path: 'order_id',
        match: { store_id: req.params.storeId }
    });
    const filtered = returns.filter(r => r.order_id);
    res.send({ success: true, data: { returns: filtered } });
});

const processReturn = catchAsync(async (req, res) => {
    const { action, note } = req.body;
    const returnReq = await orderService.processReturn(req.user._id, req.params.returnId, action, note);
    res.send({ success: true, data: { return: returnReq } });
});

module.exports = {
    requestReturn,
    getMyReturns,
    getStoreReturns,
    processReturn,
};
