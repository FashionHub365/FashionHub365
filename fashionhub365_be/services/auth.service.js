const crypto = require('crypto');
const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const { Session, User, SecurityEvent, Role } = require('../models');
const ApiError = require('../utils/ApiError');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 5;
const ADMIN_ROLE_SLUGS = ['admin', 'super-admin', 'staff', 'operator', 'finance', 'cs'];
const LOCKED_ROLE_SLUGS = [...ADMIN_ROLE_SLUGS, 'seller'];

const getGlobalRoleBySlug = async (slug) => {
    return Role.findOne({ slug, scope: 'GLOBAL', deleted_at: null }).select('_id slug');
};

const ensureDefaultUserRole = async (user) => {
    const userRole = await getGlobalRoleBySlug('user');
    if (!userRole) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'User role is not configured. Please run RBAC seed.');
    }

    const customerRole = await getGlobalRoleBySlug('customer');
    const currentRoleIds = (user.global_role_ids || []).map((role) => (role?._id || role).toString());
    const nextRoleIds = currentRoleIds.filter((roleId) => roleId !== customerRole?._id?.toString());

    if (!nextRoleIds.includes(userRole._id.toString())) {
        nextRoleIds.push(userRole._id.toString());
    }

    const changed =
        nextRoleIds.length !== currentRoleIds.length ||
        nextRoleIds.some((roleId, index) => roleId !== currentRoleIds[index]);

    if (changed) {
        user.global_role_ids = nextRoleIds;
    }

    return { userRole, changed };
};

const loginUserWithEmailAndPassword = async (identifier, password, ipAddress, userAgent) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = normalizedIdentifier.includes('@')
        ? await userService.getUserByEmail(normalizedIdentifier)
        : await User.findOne({ username: identifier.trim() }).select('+password_hash').populate('global_role_ids');

    if (!user) {
        await SecurityEvent.create({
            event_type: 'LOGIN_FAILED',
            severity: 'WARNING',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { identifier: normalizedIdentifier },
        });
        throw new ApiError(httpStatus.NOT_FOUND, 'Tài khoản không tồn tại');
    }

    // Brute force — check lock
    const roleSlugs = (user.global_role_ids || []).map((role) => role.slug);
    const shouldLockOnFailedLogin = roleSlugs.some((slug) => LOCKED_ROLE_SLUGS.includes(slug));

    if (shouldLockOnFailedLogin && user.lock_until && user.lock_until > new Date()) {
        await SecurityEvent.create({
            user_id: user._id,
            event_type: 'LOGIN_LOCKED',
            severity: 'CRITICAL',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { lock_until: user.lock_until },
        });
        const minutesLeft = Math.ceil((user.lock_until - new Date()) / 60000);
        throw new ApiError(httpStatus.TOO_MANY_REQUESTS, `Account locked. Try again in ${minutesLeft} minutes.`);
    }

    // Check password
    if (!(await user.matchPassword(password))) {
        if (shouldLockOnFailedLogin) {
            user.login_attempts = (user.login_attempts || 0) + 1;

            if (user.login_attempts >= MAX_LOGIN_ATTEMPTS) {
                user.lock_until = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
                await user.save();

                await SecurityEvent.create({
                    user_id: user._id,
                    event_type: 'LOGIN_LOCKED',
                    severity: 'CRITICAL',
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    metadata: { attempts: user.login_attempts, role_slugs: roleSlugs },
                });
                throw new ApiError(httpStatus.TOO_MANY_REQUESTS, `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`);
            }

            await user.save();
        }

        await SecurityEvent.create({
            user_id: user._id,
            event_type: 'LOGIN_FAILED',
            severity: 'WARNING',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: {
                identifier: normalizedIdentifier,
                attempts: shouldLockOnFailedLogin ? user.login_attempts : undefined,
                role_slugs: roleSlugs,
            },
        });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Sai mật khẩu');
    }

    if (user.status === 'BANNED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been banned');
    }

    if (!user.is_email_verified) {
        await SecurityEvent.create({
            user_id: user._id,
            event_type: 'LOGIN_FAILED',
            severity: 'WARNING',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { reason: 'Email not verified' },
        });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in');
    }

    // Reactivate account if it was INACTIVE (e.g. deactivated by user)
    if (user.status === 'INACTIVE') {
        user.status = 'ACTIVE';
        await SecurityEvent.create({
            user_id: user._id,
            event_type: 'ACCOUNT_REACTIVATED',
            severity: 'INFO',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { reason: 'Login successful after deactivation' },
        });
    }

    // Reset on success
    user.last_login_at = new Date();
    user.login_attempts = 0;
    user.lock_until = null;
    await user.save();

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'LOGIN_SUCCESS',
        severity: 'INFO',
        ip_address: ipAddress,
        user_agent: userAgent,
    });

    return user;
};


const refreshAuth = async (refreshToken, ipAddress, userAgent) => {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Atomic check and rotate
    // Find session that matches hash, is NOT revoked, and NOT expired
    const session = await Session.findOneAndUpdate(
        {
            refresh_token_hash: refreshTokenHash,
            is_revoked: false,
            expires_at: { $gt: new Date() }
        },
        {
            $set: { is_revoked: true, revoked_at: new Date() }
        }
    );

    if (!session) {
        // Check if it was reuse (revoked but hash matches)
        const revokedSession = await Session.findOne({ refresh_token_hash: refreshTokenHash, is_revoked: true });
        if (revokedSession) {
            await Session.updateMany({ user_id: revokedSession.user_id }, { is_revoked: true });
            await SecurityEvent.create({
                user_id: revokedSession.user_id,
                event_type: 'REFRESH_REUSE',
                severity: 'CRITICAL',
                ip_address: ipAddress,
                user_agent: userAgent,
                metadata: { attemptedTokenHash: refreshTokenHash },
            });
            throw new ApiError(httpStatus.FORBIDDEN, 'Security Alert: Refresh token reuse detected. All sessions revoked.');
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const user = await userService.getUserById(session.user_id);
    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    // R4: Check user status and verification
    if (user.status === 'BANNED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been banned');
    }
    if (!user.is_email_verified) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Email not verified');
    }

    const tokens = await tokenService.generateAuthTokens(user, { agent: userAgent }, ipAddress);
    return { user, tokens };
};

// Gap 5: logout verifies token belongs to the authenticated user
const logout = async (refreshToken, userId, ipAddress, userAgent) => {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await Session.findOne({ refresh_token_hash: refreshTokenHash });

    if (!session) return;

    // Verify ownership
    if (session.user_id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'This session does not belong to you');
    }

    if (!session.is_revoked) {
        session.is_revoked = true;
        session.revoked_at = new Date();
        await session.save();

        await SecurityEvent.create({
            user_id: session.user_id,
            event_type: 'LOGOUT',
            severity: 'INFO',
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    }
};

const loginWithGoogle = async (googlePayload, ipAddress, userAgent) => {
    const { email, sub: googleId, email_verified, name, picture } = googlePayload;

    if (!email_verified) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Google email not verified.');
    }

    let user = await User.findOne({ email });

    if (!user) {
        const userRole = await getGlobalRoleBySlug('user');
        if (!userRole) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'User role is not configured. Please run RBAC seed.');
        }

        user = await User.create({
            email,
            username: email.split('@')[0] || name.replace(/\s+/g, '').toLowerCase(),
            auth_provider: 'GOOGLE',
            google_id: googleId,
            is_email_verified: true,
            status: 'ACTIVE',
            global_role_ids: [userRole._id],
            profile: { full_name: name, avatar_url: picture }
        });

        await SecurityEvent.create({ user_id: user._id, event_type: 'ACCOUNT_CREATED_GOOGLE', severity: 'INFO', ip_address: ipAddress, user_agent: userAgent });
    } else {
        if (user.status === 'BANNED') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been banned');
        }

        if (user.status === 'PENDING' || user.status === 'INACTIVE') {
            user.status = 'ACTIVE';
        }

        if (!user.google_id && user.auth_provider === 'LOCAL') {
            user.google_id = googleId;
            user.is_email_verified = true;
            user.profile = {
                ...user.profile,
                full_name: user.profile?.full_name || name,
                avatar_url: user.profile?.avatar_url || picture,
            };
        }

        if (user.status !== 'ACTIVE') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Account is not active.');
        }

        if (user.google_id !== googleId) {
            await SecurityEvent.create({ user_id: user._id, event_type: 'SUSPICIOUS_GOOGLE_LOGIN', severity: 'CRITICAL', metadata: { attempted_google_id: googleId } });
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed.');
        }

        user.auth_provider = 'GOOGLE';
        user.last_login_at = new Date();
        user.login_attempts = 0;
        await ensureDefaultUserRole(user);
        await user.save();
    }

    return user;
};

module.exports = {
    loginUserWithEmailAndPassword,
    refreshAuth,
    logout,
    loginWithGoogle,
    ensureDefaultUserRole,
};
