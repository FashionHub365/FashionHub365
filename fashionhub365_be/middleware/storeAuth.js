const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Store, StoreMember } = require('../models');

/**
 * Middleware để kiểm tra và lấy store_id của người dùng hiện tại.
 * Yêu cầu phải gọi sau middleware auth.auth() (khi đã có req.user).
 * 
 * Middleware này sẽ:
 * 1. Tìm Store mà user làm owner.
 * 2. Nếu không có, tìm StoreMember mà user đang active.
 * 3. Gắn store_id vào req.storeId.
 * 4. Nếu không tìm thấy, trả về lỗi 403 Forbidden.
 */
const storeAuth = () => async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User is not authenticated');
        }

        let storeId = null;

        // 1. Kiểm tra xem user có phải owner của store nào không
        const ownedStore = await Store.findOne({ owner_user_id: req.user._id });
        if (ownedStore) {
            storeId = ownedStore._id;
        } else {
            // 2. Nếu không phải owner, kiểm tra xem có phải member không
            const member = await StoreMember.findOne({ user_id: req.user._id, status: 'ACTIVE' });
            if (member) {
                storeId = member.store_id;
            }
        }

        if (!storeId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'Access denied. You do not belong to any store. Please create a store or request an invitation.'
            );
        }

        req.storeId = storeId;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    storeAuth
};
