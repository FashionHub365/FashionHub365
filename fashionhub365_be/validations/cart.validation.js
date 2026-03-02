const Joi = require('joi');
const { objectId } = require('./custom.validation');

const addToCart = {
    body: Joi.object().keys({
        productId: Joi.string().required().custom(objectId),
        variantId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
    }),
};

const updateCartItem = {
    params: Joi.object().keys({
        itemId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        quantity: Joi.number().integer().min(1).required(),
    }),
};

const removeCartItem = {
    params: Joi.object().keys({
        itemId: Joi.string().required().custom(objectId),
    }),
};

module.exports = {
    addToCart,
    updateCartItem,
    removeCartItem,
};
