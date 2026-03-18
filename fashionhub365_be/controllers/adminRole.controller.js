const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Role, Permission, User, AuditLog } = require('../models');
const { userService } = require('../services');
const {
    buildSort,
    buildPaginationMeta,
    ensureSuperAdminActor,
    ensurePrivilegedAdminActor,
    assertActorCanManageRoleMutation,
    isAdminTierSlug,
    ADMIN_TIER_ROLE_SLUGS,
    assertAssignableGlobalRoles,
    assertActorCanAccessTarget
} = require('./adminUtils');

const createRole = catchAsync(async (req, res) => {
    ensureSuperAdminActor(req.user);
    const existing = await Role.findOne({ slug: req.body.slug });
    if (existing) {
        if (existing.deleted_at) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Role exists but is soft-deleted. Restore it instead.');
        }
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role already exists');
    }
    const role = await Role.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { role } });
});

const getRoles = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        scope,
        includeDeleted = false,
        sortBy = 'created_at',
        order = 'desc',
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (!includeDeleted) query.deleted_at = null;
    if (scope) query.scope = scope;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
        ];
    }

    const [roles, total] = await Promise.all([
        Role.find(query)
            .populate('permission_ids')
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        Role.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { roles },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const updateRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const role = await Role.findById(req.params.id);
    if (!role || role.deleted_at) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
    assertActorCanManageRoleMutation(actor, role);

    if (!actor.isSuperAdmin && req.body.slug && isAdminTierSlug(req.body.slug)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin cannot promote role to admin tier');
    }

    if (req.body.slug && req.body.slug !== role.slug) {
        const existing = await Role.findOne({ slug: req.body.slug });
        if (existing && existing._id.toString() !== role._id.toString()) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Role slug already exists');
        }
    }

    role.set(req.body);
    await role.save();
    res.send({ success: true, data: { role } });
});

const deleteRole = catchAsync(async (req, res) => {
    ensureSuperAdminActor(req.user);
    const role = await Role.findById(req.params.id);
    if (!role || role.deleted_at) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
    if (role.is_system) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot delete system roles');
    }

    role.deleted_at = new Date();
    await role.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'DELETE_ROLE_SOFT',
        target_collection: 'Role',
        target_id: role._id,
        old_values: { deleted_at: null },
        new_values: { deleted_at: role.deleted_at },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const restoreRole = catchAsync(async (req, res) => {
    ensureSuperAdminActor(req.user);
    const role = await Role.findById(req.params.id);
    if (!role || !role.deleted_at) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Deleted role not found');
    }

    role.deleted_at = null;
    await role.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'RESTORE_ROLE',
        target_collection: 'Role',
        target_id: role._id,
        old_values: { deleted_at: true },
        new_values: { deleted_at: null },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { role } });
});

const createPermission = catchAsync(async (req, res) => {
    ensureSuperAdminActor(req.user);
    if (await Permission.findOne({ code: req.body.code.toUpperCase() })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Permission already exists');
    }
    const permission = await Permission.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { permission } });
});

const getPermissions = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        search,
        module,
        sortBy = 'module',
        order = 'asc',
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (module) query.module = module.toUpperCase();
    if (search) {
        query.$or = [
            { code: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { module: { $regex: search, $options: 'i' } },
        ];
    }

    const [permissions, total] = await Promise.all([
        Permission.find(query)
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        Permission.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { permissions },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const assignGlobalRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const targetUser = await User.findById(req.params.userId).populate('global_role_ids');
    if (!targetUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, targetUser);
    await assertAssignableGlobalRoles(actor, req.body.roleIds || []);
    const user = await userService.assignGlobalRole(req.params.userId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { user } });
});

const assignStoreRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const targetUser = await User.findById(req.params.userId).populate('global_role_ids');
    if (!targetUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, targetUser);
    const member = await userService.assignStoreRole(req.params.userId, req.body.storeId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { member } });
});

const getRolePermissions = catchAsync(async (req, res) => {
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null }).populate('permission_ids');
    if (!role) throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    res.send({ success: true, data: { permissions: role.permission_ids } });
});

const addRolePermissions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null });
    if (!role) throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    assertActorCanManageRoleMutation(actor, role);

    const { permissionIds } = req.body;
    const permissions = await Permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more permissions are invalid');
    }

    const oldPermissionIds = [...role.permission_ids];
    role.permission_ids = Array.from(
        new Set([
            ...role.permission_ids.map((id) => id.toString()),
            ...permissionIds,
        ])
    );
    await role.save();
    await role.populate('permission_ids');

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADD_ROLE_PERMISSIONS',
        target_collection: 'Role',
        target_id: role._id,
        old_values: { permission_ids: oldPermissionIds },
        new_values: { permission_ids: role.permission_ids.map((item) => item._id) },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { role } });
});

const replaceRolePermissions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null });
    if (!role) throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    assertActorCanManageRoleMutation(actor, role);

    const { permissionIds } = req.body;
    const permissions = await Permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more permissions are invalid');
    }

    const oldPermissionIds = [...role.permission_ids];
    role.permission_ids = Array.from(new Set(permissionIds));
    await role.save();
    await role.populate('permission_ids');

    await AuditLog.create({
        user_id: req.user._id,
        action: 'REPLACE_ROLE_PERMISSIONS',
        target_collection: 'Role',
        target_id: role._id,
        old_values: { permission_ids: oldPermissionIds },
        new_values: { permission_ids: role.permission_ids.map((item) => item._id) },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { role } });
});

const removeRolePermission = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null });
    if (!role) throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    assertActorCanManageRoleMutation(actor, role);

    const oldPermissionIds = [...role.permission_ids];
    const exists = role.permission_ids.some((id) => id.toString() === req.params.permissionId);
    if (!exists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Permission is not assigned to this role');
    }

    role.permission_ids = role.permission_ids.filter((id) => id.toString() !== req.params.permissionId);
    await role.save();
    await role.populate('permission_ids');

    await AuditLog.create({
        user_id: req.user._id,
        action: 'REMOVE_ROLE_PERMISSION',
        target_collection: 'Role',
        target_id: role._id,
        old_values: { permission_ids: oldPermissionIds },
        new_values: { permission_ids: role.permission_ids.map((item) => item._id) },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const getRoleOptions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const query = { deleted_at: null };
    if (actor.isSuperAdmin) {
        query.slug = { $ne: 'super-admin' };
    } else {
        query.slug = { $nin: ADMIN_TIER_ROLE_SLUGS };
    }

    const roles = await Role.find(query)
        .select('_id name slug scope')
        .sort({ scope: 1, name: 1 });
    res.send({ success: true, data: { roles } });
});

const getGroupedPermissions = catchAsync(async (req, res) => {
    const permissions = await Permission.find().sort({ module: 1, code: 1 });
    const grouped = permissions.reduce((acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {});
    res.send({ success: true, data: { permissions: grouped } });
});

module.exports = {
    createRole,
    getRoles,
    updateRole,
    deleteRole,
    restoreRole,
    createPermission,
    getPermissions,
    assignGlobalRole,
    assignStoreRole,
    getRolePermissions,
    addRolePermissions,
    replaceRolePermissions,
    removeRolePermission,
    getRoleOptions,
    getGroupedPermissions,
};
