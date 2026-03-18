const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { User, Role, Session, AuditLog, StoreMember, UserPermissionOverride } = require('../models');
const { userService } = require('../services');
const {
    buildSort,
    buildPaginationMeta,
    ensurePrivilegedAdminActor,
    ensureSuperAdminActor,
    assertActorCanAccessTarget,
    sanitizeUser,
    buildVisibilityExcludedRoleSlugs,
    assertAssignableGlobalRoles,
    getDirectPermissionOverrides,
    mapDirectPermissionOverride,
    buildUserEffectivePermissionContext,
    ensureAdminRole
} = require('./adminUtils');

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
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { 'profile.full_name': { $regex: search, $options: 'i' } },
        ];
    }
    if (createdFrom || createdTo) {
        query.created_at = {};
        if (createdFrom) query.created_at.$gte = new Date(createdFrom);
        if (createdTo) query.created_at.$lte = new Date(createdTo);
    }

    const excludedRoleSlugs = buildVisibilityExcludedRoleSlugs(actor);
    const excludedRoles = await Role.find({ slug: { $in: excludedRoleSlugs }, deleted_at: null }).select('_id');
    const excludedRoleIds = excludedRoles.map((r) => r._id);
    if (excludedRoleIds.length > 0) query.global_role_ids = { $nin: excludedRoleIds };
    if (excludedRoleSlugs.length > 0) query.role = { $nin: excludedRoleSlugs };

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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!targetUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, user);

    const directOverrides = await getDirectPermissionOverrides(req.params.id);
    const allowPermissions = [];
    const denyPermissions = [];
    directOverrides.forEach((o) => {
        const code = o?.permission_id?.code;
        if (!code) return;
        if (o.effect === 'DENY') denyPermissions.push(code);
        else allowPermissions.push(code);
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, user);

    const permission = await Permission.findById(req.body.permissionId);
    if (!permission) throw new ApiError(httpStatus.NOT_FOUND, 'Permission not found');

    const existing = await UserPermissionOverride.findOne({
        user_id: req.params.id,
        permission_id: req.body.permissionId,
    });

    const oldValues = existing ? { effect: existing.effect, note: existing.note } : null;

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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, user);

    const override = await UserPermissionOverride.findOne({
        user_id: req.params.id,
        permission_id: req.params.permissionId,
    }).populate('permission_id', 'code name module description');
    if (!override) throw new ApiError(httpStatus.NOT_FOUND, 'Direct permission override not found');

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
    if (!targetUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, user);

    const hasRole = (user.global_role_ids || []).some((id) => id.toString() === roleId);
    if (!hasRole) throw new ApiError(httpStatus.NOT_FOUND, 'Role is not assigned to this user');

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
    if (!targetUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    assertActorCanAccessTarget(actor, targetUser);

    const query = { user_id: userId, role_ids: roleId };
    if (storeId) query.store_id = storeId;

    const members = await StoreMember.find(query);
    if (!members.length) throw new ApiError(httpStatus.NOT_FOUND, 'Store role assignment not found');

    for (const member of members) {
        const oldRoleIds = [...member.role_ids];
        member.role_ids = member.role_ids.filter((id) => id.toString() !== roleId);
        if (member.role_ids.length === 0) member.status = 'INACTIVE';
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
    res.send({ success: true, data: { user: sanitizeUser(user) } });
});

const getAdminPermissions = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);

    const user = await User.findById(req.user._id).populate({
        path: 'global_role_ids',
        populate: { path: 'permission_ids' },
    });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');

    const effectivePermissionSet = new Set();
    const globalPermissionSet = new Set();

    (user.global_role_ids || []).forEach((role) => {
        (role.permission_ids || []).forEach((permission) => {
            effectivePermissionSet.add(permission.code);
            globalPermissionSet.add(permission.code);
        });
    });

    const storeMembers = await StoreMember.find({ user_id: req.user._id, status: 'ACTIVE' })
        .populate('store_id', 'name slug')
        .populate({ path: 'role_ids', populate: { path: 'permission_ids' } });

    const stores = storeMembers.map((member) => {
        const permissions = new Set();
        (member.role_ids || []).forEach((role) => {
            (role.permission_ids || []).forEach((permission) => {
                permissions.add(permission.code);
                effectivePermissionSet.add(permission.code);
            });
        });
        return { store: member.store_id, permissions: Array.from(permissions).sort() };
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
        } else {
            directAllowSet.add(code);
            effectivePermissionSet.add(code);
        }
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Admin user not found');
    if (!(await user.matchPassword(oldPassword))) throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect');
    await userService.updateUserById(user._id, { newPassword });
    await Session.updateMany({ user_id: user._id, _id: { $ne: req.sessionId } }, { is_revoked: true, revoked_at: new Date() });

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
        let deviceInfo;
        try { deviceInfo = JSON.parse(session.device_info || '{}'); } catch (e) { deviceInfo = session.device_info; }
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
    res.send({ success: true, data: { sessions: mappedSessions } });
});

const revokeAdminSession = catchAsync(async (req, res) => {
    ensureAdminRole(req.user);
    const session = await Session.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!session) throw new ApiError(httpStatus.NOT_FOUND, 'Session not found');
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
    await Session.updateMany({ user_id: req.user._id, is_revoked: false }, { is_revoked: true, revoked_at: new Date() });
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

module.exports = {
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
};
