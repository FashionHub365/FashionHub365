const Joi = require('joi');

const login = {
    body: Joi.object().keys({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
        rememberMe: Joi.boolean().default(false),
    }),
};

const refreshToken = {
    body: Joi.object().keys({
        refreshToken: Joi.string(),
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string(),
    }),
};

module.exports = {
    login,
    refreshToken,
    logout,
};
