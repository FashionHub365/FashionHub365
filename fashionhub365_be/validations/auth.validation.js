const Joi = require('joi');
const { objectId } = require('./custom.validation');

const register = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        username: Joi.string().required(),
        full_name: Joi.string(),
    }),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
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
    }),
};

const verifyEmail = {
    body: Joi.object().keys({
        token: Joi.string().required(),
    }),
};

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
};
