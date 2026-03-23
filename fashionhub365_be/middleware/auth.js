const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config/config');
const {
    User,
    Session,
    StoreMember,
    Store,
    Role,
    InvalidatedToken,
    UserPermissionOverride,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../constants/tokens');
const { getBearerToken, hashToken } = require('../utils/token.util');

const auth = () => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }
        const token = getBearerToken(req);
        const tokenHash = hashToken(token);
        const invalidatedToken = await InvalidatedToken.findOne({ token_hash: tokenHash });
        if (invalidatedToken) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been invalidated');
        }

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
            ? (req.params?.[storeIdField] || req.body?.[storeIdField] || req.query?.[storeIdField] || req.storeId)
            : (req.params?.storeId || req.body?.storeId || req.body?.store_id || req.query?.storeId || req.storeId);

        const userPermissions = new Set();

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
            } else {
                // Backward compatibility: store owners may exist without StoreMember rows in legacy data.
                const ownedStore = await Store.findOne({ _id: storeId, owner_user_id: user._id }).select('_id');
                if (ownedStore) {
                    const storeOwnerRole = await Role.findOne({ slug: 'store-owner', scope: 'STORE', deleted_at: null })
                        .populate('permission_ids');
                    if (storeOwnerRole?.permission_ids) {
                        storeOwnerRole.permission_ids.forEach((perm) => userPermissions.add(perm.code));
                    }
                }
            }
        }

        // Direct user-level permission overrides (allow/deny for specific user)
        const overrides = await UserPermissionOverride.find({ user_id: user._id })
            .populate('permission_id', 'code')
            .select('effect permission_id');

        overrides.forEach((override) => {
            const code = override?.permission_id?.code;
            if (!code) return;
            if (override.effect === 'DENY') {
                userPermissions.delete(code);
            } else {
                userPermissions.add(code);
            }
        });

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

const getUserRoleSlugs = (user) => {
    const roles = new Set();

    const directRole = String(user?.role || '').trim().toLowerCase();
    if (directRole) {
        roles.add(directRole);
    }

    (user?.global_role_ids || []).forEach((roleLike) => {
        if (!roleLike) return;
        if (typeof roleLike === 'string') {
            roles.add(roleLike.trim().toLowerCase());
            return;
        }

        const slug = String(roleLike.slug || roleLike.name || roleLike.code || '').trim().toLowerCase();
        if (slug) {
            roles.add(slug);
        }
    });

    return Array.from(roles);
};

const denyRoles = (disallowedRoles = [], message = 'Forbidden') => (req, res, next) => {
    const blockedRoles = new Set(
        (disallowedRoles || []).map((role) => String(role || '').trim().toLowerCase()).filter(Boolean)
    );
    const userRoles = getUserRoleSlugs(req.user);

    if (userRoles.some((role) => blockedRoles.has(role))) {
        return next(new ApiError(httpStatus.FORBIDDEN, message));
    }

    return next();
};

module.exports = {
    auth,
    authorize,
    denyRoles,
};
