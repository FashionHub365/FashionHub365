const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const { Role, SecurityEvent, User, EmailVerificationToken, PasswordResetToken, Session } = require('../models');
const ApiError = require('../utils/ApiError');

// Helper: strip sensitive fields from user object
const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password_hash;
    delete obj.login_attempts;
    delete obj.lock_until;
    return obj;
};

const register = catchAsync(async (req, res) => {
    const { email, password, username, full_name } = req.body;

    // Default role: Customer
    const userRole = await Role.findOne({ slug: 'customer' });
    const global_role_ids = userRole ? [userRole._id] : [];

    // Register: status PENDING, no tokens returned
    const user = await userService.createUser({
        email,
        username,
        password, // Pass plain password, let userService hash it (R2)
        status: 'PENDING', // Default to PENDING
        global_role_ids,
        profile: { full_name: full_name || '' },
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
    // Send verification email
    try {
        console.time('EmailDispatch');
        console.log('[DEBUG] Calling emailService.sendVerificationEmail (Async) for:', email);
        const emailService = require('../services/email.service');

        // NO AWAIT here for performance
        emailService.sendVerificationEmail(email, verifyToken)
            .then(() => console.log('[DEBUG] Email sent successfully (Background)'))
            .catch((err) => console.error('[ERROR] Failed to send verification email (Background):', err));

        console.timeEnd('EmailDispatch');
    } catch (error) {
        console.error('[ERROR] Failed to initiate email sending:', error);
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
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password, req.ip, req.headers['user-agent']);
    const tokens = await tokenService.generateAuthTokens(user, req.headers['user-agent'], req.ip);
    res.send({
        success: true,
        data: { user: sanitizeUser(user), tokens },
    });
});

const logout = catchAsync(async (req, res) => {
    // Gap 5: verify ownership — pass user._id to service
    await authService.logout(req.body.refreshToken, req.user._id, req.ip, req.headers['user-agent']);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken, req.ip, req.headers['user-agent']);
    res.send({
        success: true,
        data: { tokens },
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

    res.send({
        success: true,
        data: {
            message: 'If that email exists, a reset link has been sent.',
            ...(process.env.NODE_ENV === 'development' && { resetToken: rawToken }),
        },
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;
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

    res.send({ success: true, data: { message: 'Password reset successful. All sessions revoked. Please login again.' } });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

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
    const { token } = req.body;
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
    sendVerificationEmail,
    verifyEmail,
};
