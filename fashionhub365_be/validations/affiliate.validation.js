const Joi = require('joi');

const createProgram = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        commission_rate: Joi.number().min(0).max(100).required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
        status: Joi.string().valid('active', 'inactive').default('active'),
    }),
};

const generateLink = {
    body: Joi.object().keys({
        program_id: Joi.string().required(),
        product_id: Joi.string().required(),
    }),
};

module.exports = {
    createProgram,
    generateLink,
};
