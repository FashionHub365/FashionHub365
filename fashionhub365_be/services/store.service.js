const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Store } = require('../models');
const ApiError = require('../utils/ApiError');

const PUBLIC_STORE_SELECT = 'uuid name slug description email phone rating_summary information created_at updated_at';

const normalizeSlug = (value = '') => {
    const normalized = String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return normalized || `store-${Date.now()}`;
};

const findStoreByIdOrUuid = async (storeId) => {
    const query = mongoose.Types.ObjectId.isValid(storeId)
        ? { _id: storeId }
        : { $or: [{ uuid: storeId }, { slug: storeId }] };
    return Store.findOne(query);
};

const buildUniqueSlug = async (baseSlug, excludeId = null) => {
    const root = normalizeSlug(baseSlug);
    let suffix = 0;
    while (true) {
        const slug = suffix === 0 ? root : `${root}-${suffix}`;
        const existing = await Store.findOne(excludeId ? { slug, _id: { $ne: excludeId } } : { slug }).select('_id');
        if (!existing) return slug;
        suffix += 1;
    }
};

const listStores = async (query = {}) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 100);
    const skip = (page - 1) * limit;

    // Public listing only
    const filter = {
        status: 'active',
        is_draft: false,
    };

    if (query.search) {
        const searchRegex = new RegExp(String(query.search).trim(), 'i');
        filter.$or = [{ name: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
    }

    const sortMap = {
        newest: { created_at: -1 },
        oldest: { created_at: 1 },
        rating: { 'rating_summary.avgStars': -1, created_at: -1 },
        name_asc: { name: 1 },
        name_desc: { name: -1 },
    };
    const sort = sortMap[query.sort] || sortMap.newest;

    const [stores, totalItems] = await Promise.all([
        Store.find(filter).sort(sort).skip(skip).limit(limit).select(PUBLIC_STORE_SELECT),
        Store.countDocuments(filter),
    ]);

    return {
        stores,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.max(Math.ceil(totalItems / limit), 1),
        },
    };
};

const getStoreById = async (storeId, options = {}) => {
    const store = await findStoreByIdOrUuid(storeId);
    if (!store) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store not found');
    }

    if (options.publicOnly && (store.status !== 'active' || store.is_draft)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store not found or unavailable');
    }

    return store;
};

const getPublicStoreById = async (storeId) => {
    const query = mongoose.Types.ObjectId.isValid(storeId)
        ? { _id: storeId }
        : { $or: [{ uuid: storeId }, { slug: storeId }] };
    const store = await Store.findOne(query).select('uuid owner_user_id name slug description email phone status is_draft rating_summary information addresses created_at updated_at');
    if (!store || store.status !== 'active' || store.is_draft) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store not found or unavailable');
    }
    return store;
};

const createStore = async (ownerUserId, payload) => {
    const existed = await Store.findOne({ owner_user_id: ownerUserId, status: { $ne: 'closed' } }).select('_id');
    if (existed) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You already have a store');
    }

    const slug = await buildUniqueSlug(payload.slug || payload.name);

    const storeData = {
        owner_user_id: ownerUserId,
        name: String(payload.name).trim(),
        slug,
        description: payload.description || '',
        email: payload.email || '',
        phone: payload.phone || '',
        status: payload.status || 'active',
        is_draft: payload.is_draft !== undefined ? !!payload.is_draft : true,
        information: payload.information || {},
        identification: payload.identification || {},
        addresses: Array.isArray(payload.addresses) ? payload.addresses : [],
        bank_accounts: Array.isArray(payload.bank_accounts) ? payload.bank_accounts : [],
        documents: Array.isArray(payload.documents) ? payload.documents : [],
    };

    return Store.create(storeData);
};

const updateStore = async (storeId, currentUserId, payload) => {
    const store = await findStoreByIdOrUuid(storeId);
    if (!store) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store not found');
    }

    if (String(store.owner_user_id) !== String(currentUserId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own store');
    }

    const allowedFields = [
        'name',
        'description',
        'email',
        'phone',
        'status',
        'is_draft',
        'information',
        'identification',
        'addresses',
        'bank_accounts',
        'documents',
    ];

    allowedFields.forEach((field) => {
        if (payload[field] !== undefined) {
            store[field] = payload[field];
        }
    });

    if (payload.name !== undefined) {
        store.name = String(payload.name).trim();
    }

    if (payload.slug !== undefined) {
        store.slug = await buildUniqueSlug(payload.slug, store._id);
    }

    await store.save();
    return store;
};

module.exports = {
    getPublicStoreById,
    listStores,
    getStoreById,
    createStore,
    updateStore,
};
