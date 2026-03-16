const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const {
    Order,
    User,
    Product,
    Role,
    Permission,
    Session,
    Store,
    StoreMember,
    UserPermissionOverride,
    AuditLog,
    Category,
} = require('../models');
const { userService } = require('../services');

const ADMIN_ROLE_SLUGS = ['admin', 'super-admin', 'staff', 'operator', 'finance', 'cs'];
const ADMIN_TIER_ROLE_SLUGS = ['super-admin', 'admin', 'staff', 'operator', 'finance', 'cs'];

const ensureAdminRole = (user) => {
    const roleSlugs = (user.global_role_ids || []).map((role) => role.slug);
    if (!roleSlugs.some((slug) => ADMIN_ROLE_SLUGS.includes(slug))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access denied');
    }
};

const normalizeRoleSlug = (value) => `${value || ''}`.trim().toLowerCase();

const getUserRoleSlugs = (user) => {
    const roleSlugs = new Set();
    const roles = Array.isArray(user?.global_role_ids) ? user.global_role_ids : [];
    roles.forEach((role) => {
        if (typeof role === 'string') return;
        const slug = normalizeRoleSlug(role?.slug || role?.name);
        if (slug) roleSlugs.add(slug);
    });
    if (user?.role) {
        const directRole = normalizeRoleSlug(user.role);
        if (directRole) roleSlugs.add(directRole);
    }
    return Array.from(roleSlugs);
};

const getAdminActor = (user) => {
    const roleSlugs = getUserRoleSlugs(user);
    return {
        roleSlugs,
        isSuperAdmin: roleSlugs.includes('super-admin'),
        isAdmin: roleSlugs.includes('admin'),
    };
};

const ensurePrivilegedAdminActor = (user) => {
    const actor = getAdminActor(user);
    if (!actor.isSuperAdmin && !actor.isAdmin) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only super-admin/admin can manage admin APIs');
    }
    return actor;
};

const ensureSuperAdminActor = (user) => {
    const actor = getAdminActor(user);
    if (!actor.isSuperAdmin) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only super-admin can manage RBAC settings');
    }
    return actor;
};

const isAdminTierSlug = (slug) => ADMIN_TIER_ROLE_SLUGS.includes(normalizeRoleSlug(slug));

const hasAdminTierRole = (roleSlugs = []) => roleSlugs.some((slug) => isAdminTierSlug(slug));

const hasSuperAdminRole = (roleSlugs = []) => roleSlugs.includes('super-admin');

const assertActorCanManageRoleMutation = (actor, role) => {
    if (actor.isSuperAdmin) {
        return;
    }
    if (actor.isAdmin && isAdminTierSlug(role?.slug)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin cannot modify admin-tier roles');
    }
};

const getRolesByIds = async (roleIds = []) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return [];
    }
    return Role.find({ _id: { $in: roleIds }, scope: 'GLOBAL', deleted_at: null }).select('_id slug');
};

const assertAssignableGlobalRoles = async (actor, roleIds = []) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return;
    }

    const roles = await getRolesByIds(roleIds);
    if (roles.length !== roleIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more global roles are invalid');
    }

    const roleSlugs = roles.map((role) => normalizeRoleSlug(role.slug));
    if (roleSlugs.includes('super-admin')) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign super-admin role via this API');
    }

    if (!actor.isSuperAdmin && roleSlugs.some((slug) => isAdminTierSlug(slug))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin can only assign non-admin roles');
    }
};

const assertActorCanAccessTarget = (actor, targetUser) => {
    const targetRoleSlugs = getUserRoleSlugs(targetUser);
    if (hasSuperAdminRole(targetRoleSlugs)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (actor.isSuperAdmin) {
        return;
    }
    if (actor.isAdmin && hasAdminTierRole(targetRoleSlugs)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
};

const mapDirectPermissionOverride = (override) => {
    const item = override?.toObject ? override.toObject() : { ...override };
    const permission = item?.permission_id;
    const permissionCode = typeof permission === 'string'
        ? null
        : permission?.code || null;
    return {
        ...item,
        permissionCode,
    };
};

const getDirectPermissionOverrides = async (userId) => UserPermissionOverride.find({ user_id: userId })
    .populate('permission_id', 'code name module description')
    .populate('created_by', 'email username profile.full_name')
    .populate('updated_by', 'email username profile.full_name')
    .sort({ created_at: -1 });

const buildUserEffectivePermissionContext = async (userId) => {
    const user = await User.findById(userId).populate({
        path: 'global_role_ids',
        populate: { path: 'permission_ids' },
    });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const rolePermissionSet = new Set();
    const globalRolePermissionSet = new Set();
    const storeRolePermissionSet = new Set();

    (user.global_role_ids || []).forEach((role) => {
        (role.permission_ids || []).forEach((permission) => {
            const code = permission?.code;
            if (!code) return;
            rolePermissionSet.add(code);
            globalRolePermissionSet.add(code);
        });
    });

    const storeMembers = await StoreMember.find({
        user_id: userId,
        status: 'ACTIVE',
    })
        .populate('store_id', 'name slug')
        .populate({
            path: 'role_ids',
            populate: { path: 'permission_ids' },
        });

    storeMembers.forEach((member) => {
        (member.role_ids || []).forEach((role) => {
            (role.permission_ids || []).forEach((permission) => {
                const code = permission?.code;
                if (!code) return;
                rolePermissionSet.add(code);
                storeRolePermissionSet.add(code);
            });
        });
    });

    const directOverrides = await getDirectPermissionOverrides(userId);
    const directAllowSet = new Set();
    const directDenySet = new Set();
    directOverrides.forEach((override) => {
        const code = override?.permission_id?.code;
        if (!code) return;
        if (override.effect === 'DENY') {
            directDenySet.add(code);
        } else {
            directAllowSet.add(code);
        }
    });

    const effectivePermissionSet = new Set(rolePermissionSet);
    directDenySet.forEach((code) => effectivePermissionSet.delete(code));
    directAllowSet.forEach((code) => effectivePermissionSet.add(code));

    return {
        user,
        storeMembers,
        directOverrides,
        rolePermissions: Array.from(rolePermissionSet).sort(),
        globalRolePermissions: Array.from(globalRolePermissionSet).sort(),
        storeRolePermissions: Array.from(storeRolePermissionSet).sort(),
        directAllowPermissions: Array.from(directAllowSet).sort(),
        directDenyPermissions: Array.from(directDenySet).sort(),
        effectivePermissions: Array.from(effectivePermissionSet).sort(),
    };
};

const buildVisibilityExcludedRoleSlugs = (actor) => {
    if (actor.isSuperAdmin) {
        return ['super-admin'];
    }
    return [...ADMIN_TIER_ROLE_SLUGS];
};

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password_hash;
    delete obj.login_attempts;
    delete obj.lock_until;
    return obj;
};

const buildSort = (sortBy, order) => ({
    [sortBy]: order === 'asc' ? 1 : -1,
});

const buildPaginationMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

const getSystemStats = catchAsync(async (req, res) => {
    const [orderSummary, totalUsers, totalProducts] = await Promise.all([
        Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total_amount' },
                    totalOrders: { $sum: 1 },
                    paidRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0],
                        },
                    },
                },
            },
        ]),
        User.countDocuments(),
        Product.countDocuments(),
    ]);

    const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyStats = await Order.aggregate([
        { $match: { created_at: { $gte: twelveMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: '$created_at' },
                    month: { $month: '$created_at' },
                },
                revenue: { $sum: '$total_amount' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyUsers = await User.aggregate([
        { $match: { created_at: { $gte: twelveMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: '$created_at' },
                    month: { $month: '$created_at' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.send({
        success: true,
        data: {
            summary: {
                totalRevenue: orderSummary[0]?.totalRevenue || 0,
                paidRevenue: orderSummary[0]?.paidRevenue || 0,
                totalOrders: orderSummary[0]?.totalOrders || 0,
                totalUsers,
                totalProducts,
            },
            ordersByStatus,
            monthlyStats,
            monthlyUsers,
        },
    });
});

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
    if (!includeDeleted) {
        query.deleted_at = null;
    }
    if (scope) {
        query.scope = scope;
    }
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
    if (module) {
        query.module = module.toUpperCase();
    }
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
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, targetUser);
    await assertAssignableGlobalRoles(actor, req.body.roleIds || []);
    const user = await userService.assignGlobalRole(req.params.userId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { user } });
});

const assignStoreRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const targetUser = await User.findById(req.params.userId).populate('global_role_ids');
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, targetUser);
    const member = await userService.assignStoreRole(req.params.userId, req.body.storeId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { member } });
});

const getAdminUsers = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const {
        page = 1,
        limit = 20,
        search,
        status,
        sortBy = 'created_at',
        order = 'desc',
        createdFrom,
        createdTo,
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { 'profile.full_name': { $regex: search, $options: 'i' } },
        ];
    }
    if (createdFrom || createdTo) {
        query.created_at = {};
        if (createdFrom) {
            query.created_at.$gte = new Date(createdFrom);
        }
        if (createdTo) {
            query.created_at.$lte = new Date(createdTo);
        }
    }

    const excludedRoleSlugs = buildVisibilityExcludedRoleSlugs(actor);
    const excludedRoles = await Role.find({
        slug: { $in: excludedRoleSlugs },
        deleted_at: null,
    }).select('_id');
    const excludedRoleIds = excludedRoles.map((role) => role._id);
    if (excludedRoleIds.length > 0) {
        query.global_role_ids = { $nin: excludedRoleIds };
    }
    if (excludedRoleSlugs.length > 0) {
        query.role = { $nin: excludedRoleSlugs };
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .populate('global_role_ids')
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        User.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { users: users.map(sanitizeUser) },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const getAdminUserById = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);
    res.send({ success: true, data: { user: sanitizeUser(user) } });
});

const createAdminUser = catchAsync(async (req, res) => {
    const actor = ensureSuperAdminActor(req.user);
    await assertAssignableGlobalRoles(actor, req.body.global_role_ids || []);
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { user: sanitizeUser(user) } });
});

const updateAdminUser = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const targetUser = await User.findById(req.params.id).populate('global_role_ids');
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, targetUser);
    if (Object.prototype.hasOwnProperty.call(req.body, 'global_role_ids')) {
        await assertAssignableGlobalRoles(actor, req.body.global_role_ids || []);
    }
    const user = await userService.updateUserById(req.params.id, req.body);
    res.send({ success: true, data: { user: sanitizeUser(user) } });
});

const updateAdminUserStatus = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const oldStatus = user.status;
    user.status = req.body.status;
    await user.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADMIN_USER_STATUS_CHANGE',
        target_collection: 'User',
        target_id: user._id,
        old_values: { status: oldStatus },
        new_values: { status: req.body.status, reason: req.body.reason || null },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { user: sanitizeUser(user) } });
});

const deleteAdminUser = catchAsync(async (req, res) => {
    const actor = ensureSuperAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const oldStatus = user.status;
    user.status = 'INACTIVE';
    await user.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADMIN_DISABLE_USER',
        target_collection: 'User',
        target_id: user._id,
        old_values: { status: oldStatus },
        new_values: { status: 'INACTIVE' },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const getAdminUserRoles = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const storeRoles = await StoreMember.find({ user_id: req.params.id })
        .populate('store_id', 'name slug')
        .populate('role_ids', 'name slug scope description');

    res.send({
        success: true,
        data: {
            globalRoles: user.global_role_ids || [],
            storeRoles,
        },
    });
});

const getAdminUserDirectPermissions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const directOverrides = await getDirectPermissionOverrides(req.params.id);
    const allowPermissions = [];
    const denyPermissions = [];
    directOverrides.forEach((override) => {
        const code = override?.permission_id?.code;
        if (!code) return;
        if (override.effect === 'DENY') {
            denyPermissions.push(code);
        } else {
            allowPermissions.push(code);
        }
    });

    res.send({
        success: true,
        data: {
            directPermissions: directOverrides.map(mapDirectPermissionOverride),
            allowPermissions: Array.from(new Set(allowPermissions)).sort(),
            denyPermissions: Array.from(new Set(denyPermissions)).sort(),
        },
    });
});

const upsertAdminUserDirectPermission = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const permission = await Permission.findById(req.body.permissionId);
    if (!permission) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Permission not found');
    }

    const existing = await UserPermissionOverride.findOne({
        user_id: req.params.id,
        permission_id: req.body.permissionId,
    });

    const oldValues = existing
        ? {
            effect: existing.effect,
            note: existing.note,
        }
        : null;

    const override = existing || new UserPermissionOverride({
        user_id: req.params.id,
        permission_id: req.body.permissionId,
        created_by: req.user._id,
    });
    override.effect = req.body.effect || 'ALLOW';
    override.note = req.body.note || '';
    override.updated_by = req.user._id;
    await override.save();
    await override.populate('permission_id', 'code name module description');

    await AuditLog.create({
        user_id: req.user._id,
        action: existing ? 'UPDATE_USER_DIRECT_PERMISSION' : 'CREATE_USER_DIRECT_PERMISSION',
        target_collection: 'UserPermissionOverride',
        target_id: override._id,
        old_values: oldValues,
        new_values: {
            user_id: req.params.id,
            permission_id: req.body.permissionId,
            permission_code: permission.code,
            effect: override.effect,
            note: override.note,
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({
        success: true,
        data: { directPermission: mapDirectPermissionOverride(override) },
    });
});

const deleteAdminUserDirectPermission = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const user = await User.findById(req.params.id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const override = await UserPermissionOverride.findOne({
        user_id: req.params.id,
        permission_id: req.params.permissionId,
    }).populate('permission_id', 'code name module description');
    if (!override) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Direct permission override not found');
    }

    const oldValues = {
        user_id: override.user_id,
        permission_id: override.permission_id?._id || override.permission_id,
        permission_code: override.permission_id?.code || null,
        effect: override.effect,
        note: override.note,
    };

    await override.deleteOne();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'DELETE_USER_DIRECT_PERMISSION',
        target_collection: 'UserPermissionOverride',
        target_id: override._id,
        old_values: oldValues,
        new_values: null,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const getAdminUserEffectivePermissions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const targetUser = await User.findById(req.params.id).populate('global_role_ids');
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, targetUser);

    const context = await buildUserEffectivePermissionContext(req.params.id);
    res.send({
        success: true,
        data: {
            rolePermissions: context.rolePermissions,
            globalRolePermissions: context.globalRolePermissions,
            storeRolePermissions: context.storeRolePermissions,
            directAllowPermissions: context.directAllowPermissions,
            directDenyPermissions: context.directDenyPermissions,
            effectivePermissions: context.effectivePermissions,
            directPermissions: context.directOverrides.map(mapDirectPermissionOverride),
        },
    });
});

const revokeGlobalRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const { userId, roleId } = req.params;
    const user = await User.findById(userId).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, user);

    const hasRole = (user.global_role_ids || []).some((id) => id.toString() === roleId);
    if (!hasRole) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role is not assigned to this user');
    }

    const oldRoleIds = [...user.global_role_ids];
    user.global_role_ids = user.global_role_ids.filter((id) => id.toString() !== roleId);
    await user.save();

    await AuditLog.create({
        user_id: req.user._id,
        action: 'REVOKE_GLOBAL_ROLE',
        target_collection: 'User',
        target_id: user._id,
        old_values: { global_role_ids: oldRoleIds },
        new_values: { global_role_ids: user.global_role_ids },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const revokeStoreRole = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const { userId, roleId } = req.params;
    const { storeId } = req.query;
    const targetUser = await User.findById(userId).populate('global_role_ids');
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    assertActorCanAccessTarget(actor, targetUser);

    const query = {
        user_id: userId,
        role_ids: roleId,
    };
    if (storeId) {
        query.store_id = storeId;
    }

    const members = await StoreMember.find(query);
    if (!members.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store role assignment not found');
    }

    for (const member of members) {
        const oldRoleIds = [...member.role_ids];
        member.role_ids = member.role_ids.filter((id) => id.toString() !== roleId);
        if (member.role_ids.length === 0) {
            member.status = 'INACTIVE';
        }
        await member.save();

        await AuditLog.create({
            user_id: req.user._id,
            action: 'REVOKE_STORE_ROLE',
            target_collection: 'StoreMember',
            target_id: member._id,
            old_values: { role_ids: oldRoleIds, status: 'ACTIVE' },
            new_values: { role_ids: member.role_ids, status: member.status },
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        });
    }

    res.status(httpStatus.NO_CONTENT).send();
});

const getAdminProfile = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);
    const user = await User.findById(req.user._id).populate('global_role_ids');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
    }
    res.send({ success: true, data: { user: sanitizeUser(user) } });
});

const getAdminPermissions = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);

    const user = await User.findById(req.user._id).populate({
        path: 'global_role_ids',
        populate: { path: 'permission_ids' },
    });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
    }

    const effectivePermissionSet = new Set();
    const globalPermissionSet = new Set();

    (user.global_role_ids || []).forEach((role) => {
        (role.permission_ids || []).forEach((permission) => {
            effectivePermissionSet.add(permission.code);
            globalPermissionSet.add(permission.code);
        });
    });

    const storeMembers = await StoreMember.find({
        user_id: req.user._id,
        status: 'ACTIVE',
    })
        .populate('store_id', 'name slug')
        .populate({
            path: 'role_ids',
            populate: { path: 'permission_ids' },
        });

    const stores = storeMembers.map((member) => {
        const permissions = new Set();
        (member.role_ids || []).forEach((role) => {
            (role.permission_ids || []).forEach((permission) => {
                permissions.add(permission.code);
                effectivePermissionSet.add(permission.code);
            });
        });

        return {
            store: member.store_id,
            permissions: Array.from(permissions).sort(),
        };
    });

    const directOverrides = await getDirectPermissionOverrides(req.user._id);
    const directAllowSet = new Set();
    const directDenySet = new Set();
    directOverrides.forEach((override) => {
        const code = override?.permission_id?.code;
        if (!code) return;
        if (override.effect === 'DENY') {
            directDenySet.add(code);
            effectivePermissionSet.delete(code);
            return;
        }
        directAllowSet.add(code);
        effectivePermissionSet.add(code);
    });

    res.send({
        success: true,
        data: {
            globalPermissions: Array.from(globalPermissionSet).sort(),
            stores,
            directAllowPermissions: Array.from(directAllowSet).sort(),
            directDenyPermissions: Array.from(directDenySet).sort(),
            effectivePermissions: Array.from(effectivePermissionSet).sort(),
        },
    });
});

const changeAdminPassword = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password_hash');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
    }

    if (!(await user.matchPassword(oldPassword))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect');
    }

    await userService.updateUserById(user._id, { newPassword });
    await Session.updateMany(
        { user_id: user._id, _id: { $ne: req.sessionId } },
        { is_revoked: true, revoked_at: new Date() }
    );

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADMIN_CHANGE_PASSWORD',
        target_collection: 'User',
        target_id: req.user._id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { message: 'Password changed successfully. Other sessions revoked.' } });
});

const getAdminSessions = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);

    const sessions = await Session.find({ user_id: req.user._id }).sort({ created_at: -1 });
    const mappedSessions = sessions.map((session) => {
        let deviceInfo = session.device_info;
        try {
            deviceInfo = JSON.parse(session.device_info || '{}');
        } catch (error) {
            deviceInfo = session.device_info;
        }

        return {
            id: session._id,
            ip_address: session.ip_address,
            user_agent: session.user_agent,
            device_info: deviceInfo,
            is_revoked: session.is_revoked,
            revoked_at: session.revoked_at,
            expires_at: session.expires_at,
            created_at: session.created_at,
            is_current: req.sessionId && req.sessionId.toString() === session._id.toString(),
        };
    });

    res.send({
        success: true,
        data: {
            sessions: mappedSessions,
        },
    });
});

const revokeAdminSession = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);

    const session = await Session.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!session) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Session not found');
    }

    if (!session.is_revoked) {
        session.is_revoked = true;
        session.revoked_at = new Date();
        await session.save();
    }

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADMIN_REVOKE_SESSION',
        target_collection: 'Session',
        target_id: session._id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const logoutAllAdminSessions = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);

    await Session.updateMany(
        { user_id: req.user._id, is_revoked: false },
        { is_revoked: true, revoked_at: new Date() }
    );

    res.setHeader('Set-Cookie', 'admin_refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

    await AuditLog.create({
        user_id: req.user._id,
        action: 'ADMIN_LOGOUT_ALL_SESSIONS',
        target_collection: 'Session',
        target_id: req.user._id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const getRolePermissions = catchAsync(async (req, res) => {
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null }).populate('permission_ids');
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }

    res.send({ success: true, data: { permissions: role.permission_ids } });
});

const addRolePermissions = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const role = await Role.findOne({ _id: req.params.id, deleted_at: null });
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
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
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
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
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
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

const getAuditLogs = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userId,
        action,
        targetCollection,
        targetId,
        search,
        from,
        to,
        sortBy = 'created_at',
        order = 'desc',
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (userId) {
        query.user_id = userId;
    }
    if (action) {
        query.action = { $regex: action, $options: 'i' };
    }
    if (targetCollection) {
        query.target_collection = targetCollection;
    }
    if (targetId) {
        query.target_id = targetId;
    }
    if (from || to) {
        query.created_at = {};
        if (from) {
            query.created_at.$gte = new Date(from);
        }
        if (to) {
            query.created_at.$lte = new Date(to);
        }
    }
    if (search) {
        query.$or = [
            { action: { $regex: search, $options: 'i' } },
            { target_collection: { $regex: search, $options: 'i' } },
            { ip_address: { $regex: search, $options: 'i' } },
            { user_agent: { $regex: search, $options: 'i' } },
        ];
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .populate('user_id', 'email username profile.full_name')
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { auditLogs: logs },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const getAuditLogById = catchAsync(async (req, res) => {
    const log = await AuditLog.findById(req.params.id).populate('user_id', 'email username profile.full_name');
    if (!log) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Audit log not found');
    }
    res.send({ success: true, data: { auditLog: log } });
});

const getAdminEnums = catchAsync(async (req, res) => {
    const userStatuses = User.schema.path('status').enumValues;
    const roleScopes = Role.schema.path('scope').enumValues;
    const storeMemberStatuses = StoreMember.schema.path('status').enumValues;

    res.send({
        success: true,
        data: {
            userStatuses,
            roleScopes,
            storeMemberStatuses,
        },
    });
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
    const grouped = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
            acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
    }, {});

    res.send({ success: true, data: { permissions: grouped } });
});

const getCategoryOptions = catchAsync(async (req, res) => {
    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === 'true';
    const query = includeDeleted ? {} : { deleted_at: null };
    const categories = await Category.find(query)
        .select('_id name slug parent_id deleted_at')
        .sort({ name: 1 });
    res.send({ success: true, data: { categories } });
});

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
    if (!store) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Seller request not found');
    }
    if (!store.is_draft) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Seller request was already reviewed');
    }

    const owner = await User.findById(store.owner_user_id).populate('global_role_ids');
    if (!owner) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store owner not found');
    }
    assertActorCanAccessTarget(actor, owner);

    const sellerRole = await Role.findOne({ slug: 'seller', scope: 'GLOBAL', deleted_at: null }).select('_id slug');
    if (!sellerRole) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Seller role is not configured. Please run RBAC seed.');
    }

    const oldStoreValues = { status: store.status, is_draft: store.is_draft };
    const oldOwnerRoleIds = (owner.global_role_ids || []).map((role) => (role?._id || role).toString());

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
        old_values: {
            store: oldStoreValues,
            owner_global_role_ids: oldOwnerRoleIds,
        },
        new_values: {
            store: { status: store.status, is_draft: store.is_draft },
            owner_global_role_ids: (owner.global_role_ids || []).map((role) => (role?._id || role).toString()),
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { store } });
});

const rejectSellerRequest = catchAsync(async (req, res) => {
    const actor = ensurePrivilegedAdminActor(req.user);
    const store = await Store.findById(req.params.storeId);
    if (!store) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Seller request not found');
    }
    if (!store.is_draft) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Seller request was already reviewed');
    }

    const owner = await User.findById(store.owner_user_id).populate('global_role_ids');
    if (!owner) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Store owner not found');
    }
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
        new_values: {
            status: store.status,
            is_draft: store.is_draft,
            reason: req.body.reason || null,
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.send({ success: true, data: { store } });
});

module.exports = {
    getSystemStats,
    createRole,
    getRoles,
    updateRole,
    deleteRole,
    restoreRole,
    createPermission,
    getPermissions,
    assignGlobalRole,
    assignStoreRole,
    getAdminUsers,
    getAdminUserById,
    createAdminUser,
    updateAdminUser,
    updateAdminUserStatus,
    deleteAdminUser,
    getAdminUserRoles,
    getAdminUserDirectPermissions,
    upsertAdminUserDirectPermission,
    deleteAdminUserDirectPermission,
    getAdminUserEffectivePermissions,
    revokeGlobalRole,
    revokeStoreRole,
    getAdminProfile,
    getAdminPermissions,
    changeAdminPassword,
    getAdminSessions,
    revokeAdminSession,
    logoutAllAdminSessions,
    getRolePermissions,
    addRolePermissions,
    replaceRolePermissions,
    removeRolePermission,
    getAuditLogs,
    getAuditLogById,
    getAdminEnums,
    getRoleOptions,
    getGroupedPermissions,
    getCategoryOptions,
    getSellerRequests,
    approveSellerRequest,
    rejectSellerRequest,
};
