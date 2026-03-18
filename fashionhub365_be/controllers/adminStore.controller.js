const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Store, User, Role, AuditLog } = require('../models');
const { buildSort, buildPaginationMeta, ensurePrivilegedAdminActor, assertActorCanAccessTarget } = require('./adminUtils');

const getSellerRequests = catchAsync(async (req, res) => {
    ensurePrivilegedAdminActor(req.user);
    const {
        page = 1,
        limit = 20,
        status = 'pending',
        search,
        sortBy = 'created_at',
        order = 'desc',
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status === 'pending') {
        query.is_draft = true;
    } else if (status === 'approved') {
        query.is_draft = false;
        query.status = 'active';
    } else if (status === 'rejected') {
        query.is_draft = false;
        query.status = 'inactive';
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    const [requests, total] = await Promise.all([
        Store.find(query)
            .populate('owner_user_id', 'email username profile.full_name status')
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        Store.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { sellerRequests: requests },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const approveSellerRequest = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const store = await Store.findById(req.params.storeId);
    if (!store) throw new ApiError(httpStatus.NOT_FOUND, 'Seller request not found');
    if (!store.is_draft) throw new ApiError(httpStatus.BAD_REQUEST, 'Seller request was already reviewed');

    const owner = await User.findById(store.owner_user_id).populate('global_role_ids');
    if (!owner) throw new ApiError(httpStatus.NOT_FOUND, 'Store owner not found');
    assertActorCanAccessTarget(actor, owner);

    const sellerRole = await Role.findOne({ slug: 'seller', scope: 'GLOBAL', deleted_at: null }).select('_id slug');
    if (!sellerRole) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Seller role is not configured. Please run RBAC seed.');

    const oldStoreValues = { status: store.status, is_draft: store.is_draft };
    const oldOwnerRoleIds = (owner.global_role_ids || []).map((r) => (r?._id || r).toString());

    store.status = 'active';
    store.is_draft = false;
    await store.save();

    const hasSellerRole = oldOwnerRoleIds.includes(sellerRole._id.toString());
    if (!hasSellerRole) {
        owner.global_role_ids.push(sellerRole._id);
        await owner.save();
    }

    await AuditLog.create({
        user_id: req.user._id,
        action: 'APPROVE_SELLER_REQUEST',
        target_collection: 'Store',
        target_id: store._id,
        old_values: { store: oldStoreValues, owner_global_role_ids: oldOwnerRoleIds },
        new_values: {
            store: { status: store.status, is_draft: store.is_draft },
            owner_global_role_ids: (owner.global_role_ids || []).map((r) => (r?._id || r).toString()),
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { store } });
});

const rejectSellerRequest = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const store = await Store.findById(req.params.storeId);
    if (!store) throw new ApiError(httpStatus.NOT_FOUND, 'Seller request not found');
    if (!store.is_draft) throw new ApiError(httpStatus.BAD_REQUEST, 'Seller request was already reviewed');

    const owner = await User.findById(store.owner_user_id).populate('global_role_ids');
    if (!owner) throw new ApiError(httpStatus.NOT_FOUND, 'Store owner not found');
    assertActorCanAccessTarget(actor, owner);

    const oldValues = { status: store.status, is_draft: store.is_draft };
    store.status = 'inactive';
    store.is_draft = false;
    await store.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'REJECT_SELLER_REQUEST',
        target_collection: 'Store',
        target_id: store._id,
        old_values: oldValues,
        new_values: { status: store.status, is_draft: store.is_draft, reason: req.body.reason || null },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { store } });
});

module.exports = {
    getSellerRequests,
    approveSellerRequest,
    rejectSellerRequest,
};
