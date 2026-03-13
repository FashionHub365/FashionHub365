const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Store, StoreFollower, StoreMember, Role } = require('../models');
const ApiError = require('../utils/ApiError');
const { runWithTransaction } = require('../utils/transaction');

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


        }};

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

const getStoreOwnerRole = async (session = null) => {
    const query = Role.findOne({ slug: 'store-owner', scope: 'STORE', deleted_at: null }).select('_id');
    if (session) {
        query.session(session);
    }
    const role = await query;
    if (!role) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Store owner role is not configured. Please run RBAC seed first.'
        );
    }
    return role;
};

const ensureStoreOwnerMembership = async (ownerUserId, storeId, session = null) => {
    const storeOwnerRole = await getStoreOwnerRole(session);
    const query = StoreMember.findOne({ store_id: storeId, user_id: ownerUserId });
    if (session) {
        query.session(session);
    }
    let member = await query;

    if (!member) {
        member = new StoreMember({
            store_id: storeId,
            user_id: ownerUserId,
            role_ids: [storeOwnerRole._id],
            status: 'ACTIVE',
        });
        await member.save(session ? { session } : {});
        return;
    }

    const roleIds = new Set((member.role_ids || []).map((id) => id.toString()));
    roleIds.add(storeOwnerRole._id.toString());
    member.role_ids = Array.from(roleIds);
    member.status = 'ACTIVE';
    await member.save(session ? { session } : {});
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
        status: payload.status || 'pending',
        is_draft: payload.is_draft !== undefined ? !!payload.is_draft : true,
        information: payload.information || {},
        identification: payload.identification || {},
        addresses: Array.isArray(payload.addresses) ? payload.addresses : [],
        bank_accounts: Array.isArray(payload.bank_accounts) ? payload.bank_accounts : [],
        documents: Array.isArray(payload.documents) ? payload.documents : [],
    };

    return runWithTransaction(async (session) => {
        const store = new Store(storeData);
        await store.save(session ? { session } : {});
        await ensureStoreOwnerMembership(ownerUserId, store._id, session);
        return store;
    });
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

/**
 * Theo dõi cửa hàng
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<StoreFollower>}
 */
const followStore = async (userId, storeId) => {
    const existingFollow = await StoreFollower.findOne({ user_id: userId, store_id: storeId });
    if (existingFollow) {
        return existingFollow;
    }
    return StoreFollower.create({ user_id: userId, store_id: storeId });
};

/**
 * Bỏ theo dõi cửa hàng
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<void>}
 */
const unfollowStore = async (userId, storeId) => {
    await StoreFollower.deleteOne({ user_id: userId, store_id: storeId });
};

/**
 * Lấy trạng thái theo dõi
 * @param {string} userId
 * @param {string} storeId
 * @returns {Promise<boolean>}
 */
const getFollowingStatus = async (userId, storeId) => {
    if (!userId) return false;
    const follow = await StoreFollower.findOne({ user_id: userId, store_id: storeId });
    return !!follow;
};

/**
 * Lấy số lượng người theo dõi cửa hàng
 * @param {string} storeId
 * @returns {Promise<number>}
 */
const getStoreFollowerCount = async (storeId) => {
    return StoreFollower.countDocuments({ store_id: storeId });
};

/**
 * Lấy danh sách cửa hàng đang theo dõi (có phân trang)
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getFollowingStores = async (userId, page = 1, limit = 6) => {
    const skip = (page - 1) * limit;

    const totalItems = await StoreFollower.countDocuments({ user_id: userId });
    const totalPages = Math.ceil(totalItems / limit);

    const follows = await StoreFollower.find({ user_id: userId })
        .sort({ followed_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'store_id',
            populate: {
                path: 'owner_user_id',
                select: 'profile.full_name profile.avatar_url'
            }
        });

    const items = follows.map(f => f.store_id).filter(s => s !== null);

    return {
        items,
        pagination: {
            totalItems,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit),
        }
    };
};

/**
 * Lấy cửa hàng của người dùng hiện tại
 * @param {string} userId
 * @returns {Promise<Store>}
 */
const getMyStore = async (userId) => {
    return Store.findOne({ owner_user_id: userId, status: { $ne: 'closed' } });
};

module.exports = {
    getPublicStoreById,
    listStores,
    getStoreById,
    createStore,
    updateStore,
    followStore,
    unfollowStore,
    getFollowingStatus,
    getStoreFollowerCount,
    getFollowingStores,
    getMyStore,
};

