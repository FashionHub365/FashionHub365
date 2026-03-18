const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { User, Role, UserPermissionOverride, StoreMember } = require('../models');

const ADMIN_ROLE_SLUGS = ['admin', 'super-admin', 'staff', 'operator', 'finance', 'cs'];
const ADMIN_TIER_ROLE_SLUGS = ['super-admin', 'admin', 'staff', 'operator', 'finance', 'cs'];

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

const ensureAdminRole = (user) => {
    const roleSlugs = getUserRoleSlugs(user);
    if (!roleSlugs.some((slug) => ADMIN_ROLE_SLUGS.includes(slug))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin access denied');
    }
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
    if (actor.isSuperAdmin) return;
    if (actor.isAdmin && isAdminTierSlug(role?.slug)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin cannot modify admin-tier roles');
    }
};

const getRolesByIds = async (roleIds = []) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return [];
    return Role.find({ _id: { $in: roleIds }, scope: 'GLOBAL', deleted_at: null }).select('_id slug');
};

const assertAssignableGlobalRoles = async (actor, roleIds = []) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return;
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
    if (actor.isSuperAdmin) return;
    if (actor.isAdmin && hasAdminTierRole(targetRoleSlugs)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
};

const mapDirectPermissionOverride = (override) => {
    const item = override?.toObject ? override.toObject() : { ...override };
    const permission = item?.permission_id;
    const permissionCode = typeof permission === 'string' ? null : permission?.code || null;
    return { ...item, permissionCode };
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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    const rolePermissionSet = new Set();
    const globalRolePermissionSet = new Set();
    const storeRolePermissionSet = new Set();

    (user.global_role_ids || []).forEach((role) => {
        (role.permission_ids || []).forEach((p) => {
            if (p?.code) {
                rolePermissionSet.add(p.code);
                globalRolePermissionSet.add(p.code);
            }
        });
    });

    const storeMembers = await StoreMember.find({ user_id: userId, status: 'ACTIVE' })
        .populate('store_id', 'name slug')
        .populate({ path: 'role_ids', populate: { path: 'permission_ids' } });

    storeMembers.forEach((member) => {
        (member.role_ids || []).forEach((role) => {
            (role.permission_ids || []).forEach((p) => {
                if (p?.code) {
                    rolePermissionSet.add(p.code);
                    storeRolePermissionSet.add(p.code);
                }
            });
        });
    });

    const directOverrides = await getDirectPermissionOverrides(userId);
    const directAllowSet = new Set();
    const directDenySet = new Set();
    directOverrides.forEach((o) => {
        const code = o?.permission_id?.code;
        if (!code) return;
        if (o.effect === 'DENY') directDenySet.add(code);
        else directAllowSet.add(code);
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
    if (actor.isSuperAdmin) return ['super-admin'];
    return [...ADMIN_TIER_ROLE_SLUGS];
};

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password_hash;
    delete obj.login_attempts;
    delete obj.lock_until;
    return obj;
};

const buildSort = (sortBy, order) => ({ [sortBy]: order === 'asc' ? 1 : -1 });

const buildPaginationMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

module.exports = {
    ADMIN_ROLE_SLUGS,
    ADMIN_TIER_ROLE_SLUGS,
    normalizeRoleSlug,
    getUserRoleSlugs,
    getAdminActor,
    ensureAdminRole,
    ensurePrivilegedAdminActor,
    ensureSuperAdminActor,
    isAdminTierSlug,
    hasAdminTierRole,
    hasSuperAdminRole,
    assertActorCanManageRoleMutation,
    getRolesByIds,
    assertAssignableGlobalRoles,
    assertActorCanAccessTarget,
    mapDirectPermissionOverride,
    getDirectPermissionOverrides,
    buildUserEffectivePermissionContext,
    buildVisibilityExcludedRoleSlugs,
    sanitizeUser,
    buildSort,
    buildPaginationMeta,
};
