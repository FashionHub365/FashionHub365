const Joi = require('joi');
const { objectId, password } = require('./custom.validation');

const createRole = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        slug: Joi.string().required(),
        scope: Joi.string().valid('GLOBAL', 'STORE').required(),
        description: Joi.string().allow(''),
        permission_ids: Joi.array().items(Joi.string().custom(objectId)).required(),
    }),
};

const updateRole = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        name: Joi.string(),
        slug: Joi.string(),
        scope: Joi.string().valid('GLOBAL', 'STORE'),
        description: Joi.string().allow(''),
        permission_ids: Joi.array().items(Joi.string().custom(objectId)),
    }).min(1),
};

const getRoles = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string(),
        scope: Joi.string().valid('GLOBAL', 'STORE'),
        includeDeleted: Joi.boolean().default(false),
        sortBy: Joi.string().valid('name', 'slug', 'scope', 'created_at', 'updated_at').default('created_at'),
        order: Joi.string().valid('asc', 'desc').default('desc'),
    }),
};

const createPermission = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        code: Joi.string().required(),
        module: Joi.string().required(),
        description: Joi.string().allow(''),
    }),
};

const getPermissions = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(200).default(50),
        search: Joi.string(),
        module: Joi.string(),
        sortBy: Joi.string().valid('name', 'code', 'module', 'created_at', 'updated_at').default('module'),
        order: Joi.string().valid('asc', 'desc').default('asc'),
    }),
};

const assignGlobalRole = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        roleIds: Joi.array().items(Joi.string().custom(objectId)).required(),
    }),
};

const assignStoreRole = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        storeId: Joi.string().required().custom(objectId),
        roleIds: Joi.array().items(Joi.string().custom(objectId)).required(),
    }),
};

const listAdminUsers = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'),
        sortBy: Joi.string().valid('created_at', 'updated_at', 'email', 'username', 'status', 'last_login_at').default('created_at'),
        order: Joi.string().valid('asc', 'desc').default('desc'),
        createdFrom: Joi.date().iso(),
        createdTo: Joi.date().iso(),
    }),
};

const adminUserId = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
};

const createAdminUser = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(password),
        username: Joi.string().required(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING').default('ACTIVE'),
        global_role_ids: Joi.array().items(Joi.string().custom(objectId)).default([]),
        profile: Joi.object().keys({
            full_name: Joi.string().allow(''),
            phone: Joi.string().allow(''),
            avatar_url: Joi.string().allow(''),
            gender: Joi.string().allow(''),
            dob: Joi.date(),
            bio: Joi.string().allow(''),
        }),
    }),
};

const updateAdminUser = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        email: Joi.string().email(),
        username: Joi.string(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'),
        password: Joi.string().custom(password),
        global_role_ids: Joi.array().items(Joi.string().custom(objectId)),
        profile: Joi.object().keys({
            full_name: Joi.string().allow(''),
            phone: Joi.string().allow(''),
            avatar_url: Joi.string().allow(''),
            gender: Joi.string().allow(''),
            dob: Joi.date(),
            bio: Joi.string().allow(''),
        }),
    }).min(1),
};

const updateAdminUserStatus = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING').required(),
        reason: Joi.string().allow(''),
    }),
};

const revokeGlobalRole = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
        roleId: Joi.string().required().custom(objectId),
    }),
};

const revokeStoreRole = {
    params: Joi.object().keys({
        userId: Joi.string().required().custom(objectId),
        roleId: Joi.string().required().custom(objectId),
    }),
    query: Joi.object().keys({
        storeId: Joi.string().custom(objectId),
    }),
};

const roleIdParam = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
};

const rolePermissionsBody = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        permissionIds: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),
    }),
};

const deleteRolePermission = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
        permissionId: Joi.string().required().custom(objectId),
    }),
};

const getAuditLogs = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        userId: Joi.string().custom(objectId),
        action: Joi.string(),
        targetCollection: Joi.string(),
        targetId: Joi.string().custom(objectId),
        search: Joi.string(),
        from: Joi.date().iso(),
        to: Joi.date().iso(),
        sortBy: Joi.string().valid('created_at', 'action').default('created_at'),
        order: Joi.string().valid('asc', 'desc').default('desc'),
    }),
};

const auditLogId = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
};

const changePassword = {
    body: Joi.object().keys({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required().custom(password),
    }),
};

const sessionId = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
};

const restoreCategory = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
};

const listSellerRequests = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        status: Joi.string().valid('pending', 'approved', 'rejected', 'all').default('pending'),
        search: Joi.string(),
        sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'slug', 'status').default('created_at'),
        order: Joi.string().valid('asc', 'desc').default('desc'),
    }),
};

const sellerRequestIdParam = {
    params: Joi.object().keys({
        storeId: Joi.string().required().custom(objectId),
    }),
};

const reviewSellerRequest = {
    params: Joi.object().keys({
        storeId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        reason: Joi.string().allow(''),
    }),
};

const upsertUserDirectPermission = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        permissionId: Joi.string().required().custom(objectId),
        effect: Joi.string().valid('ALLOW', 'DENY').default('ALLOW'),
        note: Joi.string().allow(''),
    }),
};

const deleteUserDirectPermission = {
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
        permissionId: Joi.string().required().custom(objectId),
    }),
};

module.exports = {
    createRole,
    updateRole,
    getRoles,
    createPermission,
    getPermissions,
    assignGlobalRole,
    assignStoreRole,
    listAdminUsers,
    adminUserId,
    createAdminUser,
    updateAdminUser,
    updateAdminUserStatus,
    revokeGlobalRole,
    revokeStoreRole,
    roleIdParam,
    rolePermissionsBody,
    deleteRolePermission,
    getAuditLogs,
    auditLogId,
    changePassword,
    sessionId,
    restoreCategory,
    listSellerRequests,
    sellerRequestIdParam,
    reviewSellerRequest,
    upsertUserDirectPermission,
    deleteUserDirectPermission,
};
