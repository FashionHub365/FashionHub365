const Joi = require('joi');

const bankAccountSchema = Joi.object().keys({
    account_name: Joi.string().trim().min(2).required(),
    account_number: Joi.string().trim().min(6).required(),
    bank_name: Joi.string().trim().min(2).required(),
}).unknown(true);

const informationSchema = Joi.object().keys({
    addressesText: Joi.string().trim().min(5).required(),
}).unknown(true);

const storePayload = {
    name: Joi.string().trim().min(2).max(200),
    slug: Joi.string().trim().min(2).max(200),
    avatar_url: Joi.string().allow(''),
    banner_url: Joi.string().allow(''),
    avatar: Joi.any(),
    banner: Joi.any(),
    description: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    phone: Joi.string().allow(''),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'closed'),
    is_draft: Joi.boolean(),
    information: Joi.object().unknown(true),
    identification: Joi.object().unknown(true),
    addresses: Joi.array().items(Joi.object().unknown(true)),
    bank_accounts: Joi.array().items(Joi.object().unknown(true)),
    documents: Joi.array().items(
        Joi.object().keys({
            docType: Joi.string().allow(''),
            fileUrl: Joi.string().allow(''),
            verified: Joi.boolean(),
            verifiedAt: Joi.date(),
        }).unknown(true)
    ),
};

const createStore = {
    body: Joi.object().keys({
        ...storePayload,
        name: storePayload.name.required(),
        description: Joi.string().trim().min(10).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().trim().min(8).required(),
        information: informationSchema.required(),
        bank_accounts: Joi.array().items(bankAccountSchema).min(1).required(),
    }),
};

const updateStore = {
    params: Joi.object().keys({
        storeId: Joi.string().required(),
    }),
    body: Joi.object().keys(storePayload).min(1),
};

const getStoreDetail = {
    params: Joi.object().keys({
        storeId: Joi.string().required(),
    }),
};

const listStores = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().allow(''),
        sort: Joi.string().valid('newest', 'oldest', 'rating', 'name_asc', 'name_desc'),
    }),
};

module.exports = {
    createStore,
    updateStore,
    getStoreDetail,
    listStores,
};
