const Joi = require('joi');

const createRole = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        slug: Joi.string().required(),
        scope: Joi.string().valid('GLOBAL', 'STORE').required(),
        description: Joi.string(),
        permission_ids: Joi.array().items(Joi.string()).required() // ObjectIds
    })
};

const assignGlobalRole = {
    params: Joi.object().keys({
        userId: Joi.string().required()
    }),
    body: Joi.object().keys({
        roleIds: Joi.array().items(Joi.string()).required()
    })
};

const assignStoreRole = {
    params: Joi.object().keys({
        userId: Joi.string().required()
    }),
    body: Joi.object().keys({
        storeId: Joi.string().required(),
        roleIds: Joi.array().items(Joi.string()).required()
    })
};

module.exports = {
    createRole,
    assignGlobalRole,
    assignStoreRole
};
