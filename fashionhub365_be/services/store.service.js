const httpStatus = require('http-status');
const { Store, StoreFollower } = require('../models');
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

/**
 * Theo dõi cửa hàng
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<StoreFollower>}
 */
const followStore = async (userId, storeId) => {
    const existingFollow = await StoreFollower.findOne({ user_id: userId, store_id: storeId });
    if (existingFollow) {
        return existingFollow;
    }
    return StoreFollower.create({ user_id: userId, store_id: storeId });
};

/**
 * Bỏ theo dõi cửa hàng
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<void>}
 */
const unfollowStore = async (userId, storeId) => {
    await StoreFollower.deleteOne({ user_id: userId, store_id: storeId });
};

/**
 * Lấy trạng thái theo dõi
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<boolean>}
 */
const getFollowingStatus = async (userId, storeId) => {
    if (!userId) return false;
    const follow = await StoreFollower.findOne({ user_id: userId, store_id: storeId });
    return !!follow;
};

/**
 * Lấy số lượng người theo dõi cửa hàng
 * @param {string} storeId
 * @returns {Promise<number>}
 */
const getStoreFollowerCount = async (storeId) => {
    return StoreFollower.countDocuments({ store_id: storeId });
};

/**
 * Lấy danh sách cửa hàng đang theo dõi (có phân trang)
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getFollowingStores = async (userId, page = 1, limit = 6) => {
    const skip = (page - 1) * limit;

    const totalItems = await StoreFollower.countDocuments({ user_id: userId });
    const totalPages = Math.ceil(totalItems / limit);

    const follows = await StoreFollower.find({ user_id: userId })
        .sort({ followed_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'store_id',
            populate: {
                path: 'owner_user_id',
                select: 'profile.full_name profile.avatar_url'
            }
        });

    const items = follows.map(f => f.store_id).filter(s => s !== null);

    return {
        items,
        pagination: {
            totalItems,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit),
        }
    };
};

module.exports = {
    getPublicStoreById,
    followStore,
    unfollowStore,
    getFollowingStatus,
    getStoreFollowerCount,
    getFollowingStores,
};

