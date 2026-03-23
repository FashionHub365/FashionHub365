const httpStatus = require('http-status');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { Role, SecurityEvent, User, EmailVerificationToken, PasswordResetToken, Session } = require('../models');
const ApiError = require('../utils/ApiError');
const { getBearerToken, invalidateAccessToken, isAccessTokenValid } = require('../utils/token.util');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Helper: strip sensitive fields from user object
const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password_hash;
    delete obj.login_attempts;
    delete obj.lock_until;
    return obj;
};

const getRefreshTokenFromRequest = (req) => {
    if (req.body?.refreshToken) {
        return req.body.refreshToken;
    }

    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('refresh_token='));
    return refreshCookie ? decodeURIComponent(refreshCookie.split('=').slice(1).join('=')) : null;
};

const setRefreshTokenCookie = (res, refreshToken, expires) => {
    const maxAge = Math.max(0, expires.getTime() - Date.now());
    res.setHeader('Set-Cookie', `refresh_token=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=Lax`);
};

const clearRefreshTokenCookie = (res) => {
    res.setHeader('Set-Cookie', 'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
};

const register = catchAsync(async (req, res) => {
    let { email, password, confirmPassword, username, full_name, fullName, phone } = req.body;
    email = email.toLowerCase(); // Ensure lowercase

    if (password !== confirmPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password and confirmPassword do not match');
    }

    username = username || email.split('@')[0];
    const normalizedFullName = full_name || fullName || '';

    const userRole = await Role.findOne({ slug: 'user', scope: 'GLOBAL', deleted_at: null }).select('_id');
    if (!userRole) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'User role is not configured. Please run RBAC seed.');
    }
    const global_role_ids = [userRole._id];

    // Register: status PENDING (Requires email verification)
    const user = await userService.createUser({
        email,
        username,
        password,
        status: 'PENDING',
        global_role_ids,
        profile: { full_name: normalizedFullName, phone: phone || '' },
    });

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'REGISTER',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    // Auto-generate verification token & "Send" email
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');

    await EmailVerificationToken.create({
        user_id: user._id,
        token_hash: verifyTokenHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    try {
        console.log(`[AUTH] Sending verification email to ${user.email}`);
        await emailService.sendVerificationEmail(user.email, verifyToken);
    } catch (error) {
        console.error('[AUTH ERROR] Failed to send verification email:', error);
    }

    res.status(httpStatus.CREATED).send({
        success: true,
        data: {
            user: sanitizeUser(user),
            message: 'Registration successful. Please check your email to verify account.',
            ...(process.env.NODE_ENV === 'development' && { verifyToken }),
        },
    });
});

const login = catchAsync(async (req, res) => {
    const { identifier, password, rememberMe } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(identifier, password, req.ip, req.headers['user-agent']);
    const tokens = await tokenService.generateAuthTokens(
        user,
        { agent: req.headers['user-agent'] },
        req.ip,
        { rememberMe: !!rememberMe }
    );

    setRefreshTokenCookie(res, tokens.refresh.token, tokens.refresh.expires);

    res.send({
        success: true,
        data: {
            requiresOtp: false,
            user: sanitizeUser(user),
            tokens: {
                access: tokens.access,
                refresh: {
                    expires: tokens.refresh.expires,
                },
            },
        },
    });
});

const verifyOtp = catchAsync(async (req, res) => {
    let { email, otpCode, rememberMe } = req.body;
    email = email.toLowerCase();

    if (!(await otpService.verifyLoginOtp(email, otpCode))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const resolvedRememberMe = await otpService.consumeRememberMe(email, rememberMe);
    const tokens = await tokenService.generateAuthTokens(
        user,
        { agent: req.headers['user-agent'] },
        req.ip,
        { rememberMe: !!rememberMe }
    );

    setRefreshTokenCookie(res, tokens.refresh.token, tokens.refresh.expires);

    return res.send({
        success: true,
        data: {
            user: sanitizeUser(user),
            tokens: {
                access: tokens.access,
                refresh: {
                    expires: tokens.refresh.expires,
                },
            },
        },
    });
});

const googleLogin = catchAsync(async (req, res) => {
    const { code, idToken } = req.body;

    if (!code && !idToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Authorization code or idToken is missing');
    }

    let tokens, ticket;
    try {
        if (code) {
            const response = await googleClient.getToken(code);
            tokens = response.tokens;

            ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } else if (idToken) {
            ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_IOS_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID].filter(Boolean),
            });
        }
    } catch (error) {
        console.error('[AUTH ERROR] Google token verification failed:', error);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Google authorization code or token');
    }

    const payload = ticket.getPayload();

    const user = await authService.loginWithGoogle(payload, req.ip, req.headers['user-agent']);

    const systemTokens = await tokenService.generateAuthTokens(user, req.headers['user-agent'], req.ip);
    setRefreshTokenCookie(res, systemTokens.refresh.token, systemTokens.refresh.expires);

    res.send({
        success: true,
        data: {
            user: sanitizeUser(user),
            tokens: {
                access: systemTokens.access,
                refresh: {
                    expires: systemTokens.refresh.expires,
                },
            },
        }
    });
});

const logout = catchAsync(async (req, res) => {
    const accessToken = getBearerToken(req);
    if (accessToken) {
        await invalidateAccessToken(accessToken);
    }

    // Gap 5: verify ownership — pass user._id to service
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
        await authService.logout(refreshToken, req.user._id, req.ip, req.headers['user-agent']);
    }
    clearRefreshTokenCookie(res);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
    }

    const { tokens } = await authService.refreshAuth(refreshToken, req.ip, req.headers['user-agent']);
    setRefreshTokenCookie(res, tokens.refresh.token, tokens.refresh.expires);
    res.send({
        success: true,
        data: {
            tokens: {
                access: tokens.access,
                refresh: {
                    expires: tokens.refresh.expires,
                },
            },
        },
    });
});

const getMe = catchAsync(async (req, res) => {
    res.send({
        success: true,
        data: { user: sanitizeUser(req.user) },
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password_hash');
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    if (!(await user.matchPassword(oldPassword))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect');
    }

    // Use centralized update service (R2)
    await userService.updateUserById(user._id, { newPassword });

    await Session.updateMany(
        { user_id: user._id, _id: { $ne: req.sessionId } },
        { is_revoked: true, revoked_at: new Date() }
    );

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'PASSWORD_CHANGE',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { message: 'Password changed successfully. Other sessions revoked.' } });
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.send({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
    }

    await PasswordResetToken.updateMany({ user_id: user._id, used_at: null }, { used_at: new Date() });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordResetToken.create({
        user_id: user._id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    console.log(`[DEV] Password reset token for ${email}: ${rawToken}`);

    try {
        await emailService.sendResetPasswordEmail(user.email, rawToken);
    } catch (error) {
        console.error('[AUTH ERROR] Failed to send reset password email:', error);
    }

    res.send({
        success: true,
        data: {
            message: 'If that email exists, a reset link has been sent.',
            ...(process.env.NODE_ENV === 'development' && { resetToken: rawToken }),
        },
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'newPassword and confirmPassword do not match');
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenDoc = await PasswordResetToken.findOne({
        token_hash: tokenHash,
        used_at: null,
        expires_at: { $gt: new Date() },
    });

    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired reset token');
    }

    const user = await User.findById(tokenDoc.user_id);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    // Use centralized update service (R2)
    await userService.updateUserById(user._id, { newPassword });

    tokenDoc.used_at = new Date();
    await tokenDoc.save();

    await Session.updateMany({ user_id: user._id }, { is_revoked: true, revoked_at: new Date() });

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'PASSWORD_RESET_SUCCESS',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    await emailService.sendPasswordChangedConfirmationEmail(user.email);

    res.send({ success: true, data: { message: 'Password reset successful. All sessions revoked. Please login again.' } });
});

const validateResetToken = catchAsync(async (req, res) => {
    const tokenHash = crypto.createHash('sha256').update(req.query.token).digest('hex');

    const tokenDoc = await PasswordResetToken.findOne({
        token_hash: tokenHash,
        used_at: null,
        expires_at: { $gt: new Date() },
    });

    res.send({
        success: true,
        data: {
            valid: !!tokenDoc,
        },
    });
});

const tokenValid = catchAsync(async (req, res) => {
    const token = req.body?.token || getBearerToken(req);
    if (!token) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Access token is required');
    }
    const valid = await isAccessTokenValid(token);
    return res.send({ success: true, data: { valid } });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Return success to prevent enumeration
        return res.send({ success: true, data: { message: 'If that email exists, a verification link has been sent.' } });
    }

    if (user.is_email_verified) {
        return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: { code: 400, message: 'Email already verified' } });
    }

    // Rate limit check could be here or via middleware

    await EmailVerificationToken.updateMany({ user_id: user._id, used_at: null }, { used_at: new Date() });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await EmailVerificationToken.create({
        user_id: user._id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'EMAIL_VERIFY_REQUEST',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    console.log(`[DEV] Email verification token for ${user.email}: ${rawToken}`);

    try {
        await require('../services/email.service').sendVerificationEmail(user.email, rawToken);
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
    }

    res.send({
        success: true,
        data: {
            message: 'If that email exists, a verification link has been sent.',
            ...(process.env.NODE_ENV === 'development' && { verifyToken: rawToken }),
        },
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const token = req.body?.token || req.query.token;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenDoc = await EmailVerificationToken.findOne({
        token_hash: tokenHash,
        used_at: null,
        expires_at: { $gt: new Date() },
    });

    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification token');
    }

    const user = await User.findById(tokenDoc.user_id);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    user.is_email_verified = true;
    if (user.status === 'PENDING') {
        user.status = 'ACTIVE';
    }
    await user.save();

    tokenDoc.used_at = new Date();
    await tokenDoc.save();

    await SecurityEvent.create({
        user_id: user._id,
        event_type: 'EMAIL_VERIFY_SUCCESS',
        severity: 'INFO',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    await emailService.sendWelcomeEmail(user.email);

    res.send({ success: true, data: { message: 'Email verified successfully.' } });
});

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
    validateResetToken,
    tokenValid,
    sendVerificationEmail,
    verifyEmail,
    googleLogin,
};
