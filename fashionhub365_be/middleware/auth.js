const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config/config');
const { User, Session, StoreMember } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../constants/tokens');

const auth = () => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }
        const token = authHeader.split(' ')[1];

        const payload = jwt.verify(token, config.jwt.secret);
        if (payload.type !== tokenTypes.ACCESS) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
        }

        // Check Session (Strict Mode)
        if (payload.sid) {
            const session = await Session.findById(payload.sid);
            if (!session || session.is_revoked) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Session revoked or invalid');
            }
            // R4: Check session expiry
            if (session.expires_at < new Date()) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
            }
            req.sessionId = payload.sid;
        }
        const user = await User.findById(payload.sub).populate('global_role_ids');
        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }
        if (user.status !== 'ACTIVE') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Your account is not active');
        }

        // L1: Check if password was changed after token was issued
        if (user.isPasswordChangedAfter(payload.iat)) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Password recently changed. Please login again.');
        }

        req.user = user;
        req.sessionId = payload.sid;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
        } else {
            next(error instanceof ApiError ? error : new ApiError(httpStatus.UNAUTHORIZED, error.message || 'Please authenticate'));
        }
    }
};

// L2: authorize supports mode 'AND' | 'OR' (default OR)
const authorize = (requiredPermissions = [], options = {}) => async (req, res, next) => {
    try {
        const user = req.user;
        const mode = options.mode || 'OR';
        const storeIdField = options.storeIdFrom || null;
        const storeId = storeIdField
            ? (req.params[storeIdField] || req.body[storeIdField] || req.query[storeIdField])
            : (req.params.storeId || req.body.storeId || req.query.storeId);

        let userPermissions = new Set();

        // Global permissions
        await user.populate({
            path: 'global_role_ids',
            populate: { path: 'permission_ids' },
        });

        user.global_role_ids.forEach(role => {
            if (role.permission_ids) {
                role.permission_ids.forEach(perm => userPermissions.add(perm.code));
            }
        });

        // Store permissions (if storeId present)
        if (storeId) {
            const member = await StoreMember.findOne({ user_id: user._id, store_id: storeId, status: 'ACTIVE' })
                .populate({
                    path: 'role_ids',
                    populate: { path: 'permission_ids' },
                });

            if (member) {
                member.role_ids.forEach(role => {
                    if (role.permission_ids) {
                        role.permission_ids.forEach(perm => userPermissions.add(perm.code));
                    }
                });
            }
        }

        // Permission check
        if (requiredPermissions.length > 0) {
            let hasPermission;
            if (mode === 'AND') {
                hasPermission = requiredPermissions.every(perm => userPermissions.has(perm));
            } else {
                hasPermission = requiredPermissions.some(perm => userPermissions.has(perm));
            }

            if (!hasPermission) {
                throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Insufficient rights');
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    auth,
    authorize,
};
