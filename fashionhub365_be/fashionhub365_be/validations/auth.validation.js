const Joi = require('joi');
const { objectId } = require('./custom.validation');

const register = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        confirmPassword: Joi.string().required().min(8),
        username: Joi.string(),
        full_name: Joi.string(),
        fullName: Joi.string(),
        phone: Joi.string(),
    }),
};

const login = {
    body: Joi.object().keys({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
        rememberMe: Joi.boolean().default(false),
    }),
};

const verifyOtp = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        otpCode: Joi.string().required().length(6),
        rememberMe: Joi.boolean().default(false),
    }),
};

const tokenValid = {
    body: Joi.object().keys({
        token: Joi.string(),
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string(),
    }),
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string(),
    }),
};

const changePassword = {
    body: Joi.object().keys({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required().min(8),
    }),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
    }),
};

const resetPassword = {
    body: Joi.object().keys({
        token: Joi.string().required(),
        newPassword: Joi.string().required().min(8),
        confirmPassword: Joi.string().required().min(8),
    }),
};

const validateResetToken = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
};

const verifyEmail = {
    body: Joi.object().keys({
        token: Joi.string(),
    }),
    query: Joi.object().keys({
        token: Joi.string(),
    }).or('token'),
};

const googleLogin = {
    body: Joi.object().keys({
        code: Joi.string().required(),
    }),
};

module.exports = {
    register,
    login,
    verifyOtp,
    tokenValid,
    logout,
    refreshTokens,
    changePassword,
    forgotPassword,
    resetPassword,
    validateResetToken,
    verifyEmail,
    googleLogin,
};
