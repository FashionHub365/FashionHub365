const Joi = require('joi');

const addressBody = {
    full_name: Joi.string().required(),
    phone: Joi.string().required(),
    line1: Joi.string().required(),
    line2: Joi.string().allow(''),
    ward: Joi.string().allow(''),
    district: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().allow(''),
    postal_code: Joi.string().allow(''),
    country: Joi.string().allow(''),
    note: Joi.string().allow(''),
    is_default: Joi.boolean(),
};

const createAddress = {
    body: Joi.object().keys(addressBody),
};

const updateAddress = {
    params: Joi.object().keys({
        uuid: Joi.string().required(),
    }),
    body: Joi.object().keys({
        full_name: Joi.string(),
        phone: Joi.string(),
        line1: Joi.string(),
        line2: Joi.string().allow(''),
        ward: Joi.string().allow(''),
        district: Joi.string(),
        city: Joi.string(),
        state: Joi.string().allow(''),
        postal_code: Joi.string().allow(''),
        country: Joi.string().allow(''),
        note: Joi.string().allow(''),
        is_default: Joi.boolean(),
    }).min(1),
};

const addressParams = {
    params: Joi.object().keys({
        uuid: Joi.string().required(),
    }),
};

module.exports = {
    createAddress,
    updateAddress,
    addressParams,
};
