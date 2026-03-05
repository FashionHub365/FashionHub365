const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { authService, tokenService } = require('../services');

const ADMIN_ROLE_SLUGS = ['admin', 'super-admin', 'staff', 'operator', 'finance', 'cs'];

const getRefreshTokenFromRequest = (req) => {
    if (req.body?.refreshToken) {
        return req.body.refreshToken;
    }

    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('admin_refresh_token='));
    return refreshCookie ? decodeURIComponent(refreshCookie.split('=').slice(1).join('=')) : null;
};

const setAdminRefreshCookie = (res, refreshToken, expires) => {
    const maxAge = Math.max(0, expires.getTime() - Date.now());
    res.setHeader('Set-Cookie', `admin_refresh_token=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAge / 1000)}; SameSite=Lax`);
};

const clearAdminRefreshCookie = (res) => {
    res.setHeader('Set-Cookie', 'admin_refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
};

const ensureAdminRole = (user) => {
    const roleSlugs = (user.global_role_ids || []).map((role) => role.slug);
    if (!roleSlugs.some((slug) => ADMIN_ROLE_SLUGS.includes(slug))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access denied');
    }
};

const login = catchAsync(async (req, res) => {
    const { identifier, password, rememberMe } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(identifier, password, req.ip, req.headers['user-agent']);
    ensureAdminRole(user);

    const tokens = await tokenService.generateAuthTokens(
        user,
        { agent: req.headers['user-agent'], channel: 'admin' },
        req.ip,
        { rememberMe }
    );

    setAdminRefreshCookie(res, tokens.refresh.token, tokens.refresh.expires);

    res.send({
        success: true,
        data: {
            user: user.toObject ? {
                ...user.toObject(),
                password_hash: undefined,
                login_attempts: undefined,
                lock_until: undefined,
            } : user,
            tokens: {
                access: tokens.access,
                refresh: {
                    expires: tokens.refresh.expires,
                },
            },
        },
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const refreshTokenValue = getRefreshTokenFromRequest(req);
    if (!refreshTokenValue) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
    }

    const { user, tokens } = await authService.refreshAuth(refreshTokenValue, req.ip, req.headers['user-agent']);
    ensureAdminRole(user);
    setAdminRefreshCookie(res, tokens.refresh.token, tokens.refresh.expires);

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

const logout = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);
    const refreshTokenValue = getRefreshTokenFromRequest(req);
    if (refreshTokenValue) {
        await authService.logout(refreshTokenValue, req.user._id, req.ip, req.headers['user-agent']);
    }

    clearAdminRefreshCookie(res);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    login,
    refreshToken,
    logout,
};
