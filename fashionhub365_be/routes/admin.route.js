const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const adminValidation = require('../validations/admin.validation');
const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.get('/stats', auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getSystemStats);

router.get('/profile', auth.auth(), adminController.getAdminProfile);
router.get('/me/permissions', auth.auth(), adminController.getAdminPermissions);
router.post('/change-password', auth.auth(), validate(adminValidation.changePassword), adminController.changeAdminPassword);
router.get('/sessions', auth.auth(), adminController.getAdminSessions);
router.delete('/sessions/:id', auth.auth(), validate(adminValidation.sessionId), adminController.revokeAdminSession);
router.post('/logout-all', auth.auth(), adminController.logoutAllAdminSessions);

router.route('/users')
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(adminValidation.listAdminUsers), adminController.getAdminUsers)
    .post(auth.auth(), auth.authorize(['USER.CREATE']), validate(adminValidation.createAdminUser), adminController.createAdminUser);

router.get('/users/:id/roles',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.adminUserId),
    adminController.getAdminUserRoles
);

router.get('/users/:id/direct-permissions',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.adminUserId),
    adminController.getAdminUserDirectPermissions
);

router.post('/users/:id/direct-permissions',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.upsertUserDirectPermission),
    adminController.upsertAdminUserDirectPermission
);

router.delete('/users/:id/direct-permissions/:permissionId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.deleteUserDirectPermission),
    adminController.deleteAdminUserDirectPermission
);

router.get('/users/:id/effective-permissions',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.adminUserId),
    adminController.getAdminUserEffectivePermissions
);

router.patch('/users/:id/status',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.updateAdminUserStatus),
    adminController.updateAdminUserStatus
);

router.route('/users/:id')
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(adminValidation.adminUserId), adminController.getAdminUserById)
    .put(auth.auth(), auth.authorize(['USER.UPDATE']), validate(adminValidation.updateAdminUser), adminController.updateAdminUser)
    .delete(auth.auth(), auth.authorize(['USER.DELETE']), validate(adminValidation.adminUserId), adminController.deleteAdminUser);

router.post('/users/:userId/global-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignGlobalRole),
    adminController.assignGlobalRole
);

router.delete('/users/:userId/global-roles/:roleId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.revokeGlobalRole),
    adminController.revokeGlobalRole
);

router.post('/users/:userId/store-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignStoreRole),
    adminController.assignStoreRole
);

router.delete('/users/:userId/store-roles/:roleId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.revokeStoreRole),
    adminController.revokeStoreRole
);

router.get('/seller-requests',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.listSellerRequests),
    adminController.getSellerRequests
);

router.patch('/seller-requests/:storeId/approve',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.sellerRequestIdParam),
    adminController.approveSellerRequest
);

router.patch('/seller-requests/:storeId/reject',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.reviewSellerRequest),
    adminController.rejectSellerRequest
);

router.get('/categories', auth.auth(), auth.authorize(['ROLE.VIEW']), categoryController.getCategories);
router.get('/categories/options', auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getCategoryOptions);
router.post('/categories', auth.auth(), auth.authorize(['ROLE.UPDATE']), categoryController.createCategory);
router.put('/categories/:id', auth.auth(), auth.authorize(['ROLE.UPDATE']), categoryController.updateCategory);
router.delete('/categories/:id', auth.auth(), auth.authorize(['ROLE.DELETE']), categoryController.deleteCategory);
router.patch('/categories/:id/restore',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.restoreCategory),
    categoryController.restoreCategory
);

router.route('/roles')
    .post(auth.auth(), auth.authorize(['ROLE.CREATE']), validate(adminValidation.createRole), adminController.createRole)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), validate(adminValidation.getRoles), adminController.getRoles);

router.get(
    '/roles/options',
    auth.auth(),
    auth.authorize(['ROLE.VIEW', 'USER.ASSIGN_ROLE']),
    adminController.getRoleOptions
);

router.route('/roles/:id')
    .put(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.updateRole), adminController.updateRole)
    .delete(auth.auth(), auth.authorize(['ROLE.DELETE']), validate(adminValidation.roleIdParam), adminController.deleteRole);

router.patch('/roles/:id/restore',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.roleIdParam),
    adminController.restoreRole
);

router.get('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.roleIdParam),
    adminController.getRolePermissions
);

router.post('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.rolePermissionsBody),
    adminController.addRolePermissions
);

router.put('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.rolePermissionsBody),
    adminController.replaceRolePermissions
);

router.delete('/roles/:id/permissions/:permissionId',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.deleteRolePermission),
    adminController.removeRolePermission
);

router.route('/permissions')
    .post(auth.auth(), auth.authorize(['PERMISSION.CREATE']), validate(adminValidation.createPermission), adminController.createPermission)
    .get(auth.auth(), auth.authorize(['PERMISSION.VIEW']), validate(adminValidation.getPermissions), adminController.getPermissions);

router.get('/permissions/grouped', auth.auth(), auth.authorize(['PERMISSION.VIEW']), adminController.getGroupedPermissions);

router.get('/audit-logs',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.getAuditLogs),
    adminController.getAuditLogs
);

router.get('/audit-logs/:id',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.auditLogId),
    adminController.getAuditLogById
);

router.get('/enums', auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getAdminEnums);

module.exports = router;
