const httpStatus = require('http-status');
const { Store } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Lấy thông tin chi tiết cửa hàng công khai
 * @param {string} storeId
 * @returns {Promise<Store>}
 */
const getPublicStoreById = async (storeId) => {
    const store = await Store.findById(storeId)
        .populate('owner_user_id', 'profile.full_name profile.avatar_url');
    if (!store || store.status !== 'active') {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy cửa hàng hoặc cửa hàng đã ngừng hoạt động.');
    }
    return store;
};

module.exports = {
    getPublicStoreById,
};
