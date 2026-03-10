const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { storeService } = require('../services');

const listStores = catchAsync(async (req, res) => {
    const result = await storeService.listStores(req.query);
    res.status(httpStatus.OK).send({
        success: true,
        data: result,
    });
});

const getStoreDetail = catchAsync(async (req, res) => {
    const store = await storeService.getPublicStoreById(req.params.storeId);
    res.status(httpStatus.OK).send({
        success: true,
        data: { store },
    });
});

const createStore = catchAsync(async (req, res) => {
    const store = await storeService.createStore(req.user._id, req.body);
    res.status(httpStatus.CREATED).send({
        success: true,
        data: { store },
    });
});

const updateStore = catchAsync(async (req, res) => {
    const store = await storeService.updateStore(req.params.storeId, req.user._id, req.body);
    res.status(httpStatus.OK).send({
        success: true,
        data: { store },
    });
});

module.exports = {
    listStores,
    getStoreDetail,
    createStore,
    updateStore,
};
