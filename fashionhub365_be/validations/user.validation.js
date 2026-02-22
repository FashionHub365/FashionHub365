const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createUser = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        username: Joi.string().required(),
        full_name: Joi.string(),
    }),
};

// M4: Updated to match controller filter/pagination params
const getUsers = {
    query: Joi.object().keys({
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'),
        email: Joi.string(),
        username: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1).max(100).default(20),
        page: Joi.number().integer().min(1).default(1),
    }),
};

const getUser = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
    }),
};

const updateUser = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            email: Joi.string().email(),
            username: Joi.string(),
            profile: Joi.object().keys({
                full_name: Joi.string(),
                phone: Joi.string(),
                avatar_url: Joi.string(),
                gender: Joi.string(),
                dob: Joi.date(),
                bio: Joi.string(),
            }),
            status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'),
        })
        .min(1),
};

const updateMe = {
    body: Joi.object()
        .keys({
            email: Joi.string().email(),
            username: Joi.string(),
            profile: Joi.object().keys({
                full_name: Joi.string(),
                phone: Joi.string(),
                avatar_url: Joi.string(),
                gender: Joi.string(),
                dob: Joi.date(),
                bio: Joi.string(),
            })
        })
        .min(1),
};

const deleteUser = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
    }),
};

const deleteMe = {
    body: Joi.object().keys({
        password: Joi.string().required()
    })
};

module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe
};
