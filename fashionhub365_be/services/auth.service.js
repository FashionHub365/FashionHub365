const crypto = require('crypto');
const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const { Session, User, SecurityEvent } = require('../models');
const ApiError = require('../utils/ApiError');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

const loginUserWithEmailAndPassword = async (email, password, ipAddress, userAgent) => {
    const user = await userService.getUserByEmail(email);

    if (!user) {
        await SecurityEvent.create({
            event_type: 'LOGIN_FAILED',
            severity: 'WARNING',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { email },
        });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    // Brute force — check lock
    if (user.lock_until && user.lock_until > new Date()) {
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
                metadata: { attempts: user.login_attempts },
            });
            throw new ApiError(httpStatus.TOO_MANY_REQUESTS, `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`);
        }

        await user.save();

        await SecurityEvent.create({
            user_id: user._id,
            event_type: 'LOGIN_FAILED',
            severity: 'WARNING',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: { email, attempts: user.login_attempts },
        });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
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

    return tokenService.generateAuthTokens(user, { agent: userAgent }, ipAddress);
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

module.exports = {
    loginUserWithEmailAndPassword,
    refreshAuth,
    logout,
};
