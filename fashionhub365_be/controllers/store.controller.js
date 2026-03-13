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

const followStore = catchAsync(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const { storeId } = req.params;
    const follow = await storeService.followStore(userId, storeId);
    res.status(httpStatus.CREATED).send({
        success: true,
        data: follow,
    });
});

const unfollowStore = catchAsync(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const { storeId } = req.params;
    await storeService.unfollowStore(userId, storeId);
    res.status(httpStatus.OK).send({
        success: true,
        message: 'Đã bỏ theo dõi cửa hàng',
    });
});

const getFollowingStatus = catchAsync(async (req, res) => {
    const userId = req.user?.id || req.user?._id;
    const { storeId } = req.params;
    const isFollowing = await storeService.getFollowingStatus(userId, storeId);
    res.status(httpStatus.OK).send({
        success: true,
        data: { isFollowing },
    });
});

const getStoreFollowerCount = catchAsync(async (req, res) => {
    const { storeId } = req.params;
    const count = await storeService.getStoreFollowerCount(storeId);
    res.status(httpStatus.OK).send({
        success: true,
        data: { count },
    });
});

const getFollowingStores = catchAsync(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const { page, limit } = req.query;
    const result = await storeService.getFollowingStores(userId, page, limit);
    res.status(httpStatus.OK).send({
        success: true,
        data: {
            stores: result.items,
            pagination: result.pagination
        },
    });
});

module.exports = {
    listStores,
    getStoreDetail,
    createStore,
    updateStore,
    followStore,
    unfollowStore,
    getFollowingStatus,
    getStoreFollowerCount,
    getFollowingStores,
};


