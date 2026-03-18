const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const adminValidation = require('../validations/admin.validation');
const adminUserController = require('../controllers/adminUser.controller');
const adminRoleController = require('../controllers/adminRole.controller');
const adminSystemController = require('../controllers/adminSystem.controller');
const adminStoreController = require('../controllers/adminStore.controller');
const categoryController = require('../controllers/category.controller');
const brandController = require('../controllers/brand.controller');
const collectionController = require('../controllers/collection.controller');
const tagController = require('../controllers/tag.controller');

const router = express.Router();

router.get('/stats', auth.auth(), auth.authorize(['ROLE.VIEW']), adminSystemController.getSystemStats);

router.get('/profile', auth.auth(), adminUserController.getAdminProfile);
router.get('/me/permissions', auth.auth(), adminUserController.getAdminPermissions);
router.post('/change-password', auth.auth(), validate(adminValidation.changePassword), adminUserController.changeAdminPassword);
router.get('/sessions', auth.auth(), adminUserController.getAdminSessions);
router.delete('/sessions/:id', auth.auth(), validate(adminValidation.sessionId), adminUserController.revokeAdminSession);
router.post('/logout-all', auth.auth(), adminUserController.logoutAllAdminSessions);

router.route('/users')
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(adminValidation.listAdminUsers), adminUserController.getAdminUsers)
    .post(auth.auth(), auth.authorize(['USER.CREATE']), validate(adminValidation.createAdminUser), adminUserController.createAdminUser);

router.get('/users/:id/roles',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.adminUserId),
    adminUserController.getAdminUserRoles
);

router.get('/users/:id/direct-permissions',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.adminUserId),
    adminUserController.getAdminUserDirectPermissions
);

router.post('/users/:id/direct-permissions',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.upsertUserDirectPermission),
    adminUserController.upsertAdminUserDirectPermission
);

router.delete('/users/:id/direct-permissions/:permissionId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_PERMISSION', 'USER.ASSIGN_ROLE']),
    validate(adminValidation.deleteUserDirectPermission),
    adminUserController.deleteAdminUserDirectPermission
);

router.get('/users/:id/effective-permissions',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.adminUserId),
    adminUserController.getAdminUserEffectivePermissions
);

router.patch('/users/:id/status',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.updateAdminUserStatus),
    adminUserController.updateAdminUserStatus
);

router.route('/users/:id')
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(adminValidation.adminUserId), adminUserController.getAdminUserById)
    .put(auth.auth(), auth.authorize(['USER.UPDATE']), validate(adminValidation.updateAdminUser), adminUserController.updateAdminUser)
    .delete(auth.auth(), auth.authorize(['USER.DELETE']), validate(adminValidation.adminUserId), adminUserController.deleteAdminUser);

router.post('/users/:userId/global-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignGlobalRole),
    adminRoleController.assignGlobalRole
);

router.delete('/users/:userId/global-roles/:roleId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.revokeGlobalRole),
    adminUserController.revokeGlobalRole
);

router.post('/users/:userId/store-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignStoreRole),
    adminRoleController.assignStoreRole
);

router.delete('/users/:userId/store-roles/:roleId',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.revokeStoreRole),
    adminUserController.revokeStoreRole
);

router.get('/seller-requests',
    auth.auth(),
    auth.authorize(['USER.VIEW']),
    validate(adminValidation.listSellerRequests),
    adminStoreController.getSellerRequests
);

router.patch('/seller-requests/:storeId/approve',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.sellerRequestIdParam),
    adminStoreController.approveSellerRequest
);

router.patch('/seller-requests/:storeId/reject',
    auth.auth(),
    auth.authorize(['USER.UPDATE']),
    validate(adminValidation.reviewSellerRequest),
    adminStoreController.rejectSellerRequest
);

router.get('/categories', auth.auth(), auth.authorize(['ROLE.VIEW']), categoryController.getCategories);
router.get('/categories/options', auth.auth(), auth.authorize(['ROLE.VIEW']), adminSystemController.getCategoryOptions);
router.post('/categories', auth.auth(), auth.authorize(['ROLE.UPDATE']), categoryController.createCategory);
router.put('/categories/:id', auth.auth(), auth.authorize(['ROLE.UPDATE']), categoryController.updateCategory);
router.delete('/categories/:id', auth.auth(), auth.authorize(['ROLE.DELETE']), categoryController.deleteCategory);
router.patch('/categories/:id/restore',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.restoreCategory),
    categoryController.restoreCategory
);

// Brands
router.route('/brands')
    .post(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.createBrand), brandController.createBrand)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), brandController.getBrands);

router.route('/brands/:brandId')
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), brandController.getBrand)
    .put(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.updateBrand), brandController.updateBrand)
    .delete(auth.auth(), auth.authorize(['ROLE.DELETE']), brandController.deleteBrand);

// Collections
router.route('/collections')
    .post(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.createCollection), collectionController.createCollection)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), collectionController.getCollections);

router.route('/collections/:collectionId')
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), collectionController.getCollection)
    .put(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.updateCollection), collectionController.updateCollection)
    .delete(auth.auth(), auth.authorize(['ROLE.DELETE']), collectionController.deleteCollection);

// Tags
router.route('/tags')
    .post(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.createTag), tagController.createTag)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), tagController.getTags);

router.delete('/tags/:tagId', auth.auth(), auth.authorize(['ROLE.DELETE']), tagController.deleteTag);

router.route('/roles')
    .post(auth.auth(), auth.authorize(['ROLE.CREATE']), validate(adminValidation.createRole), adminRoleController.createRole)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), validate(adminValidation.getRoles), adminRoleController.getRoles);

router.get(
    '/roles/options',
    auth.auth(),
    auth.authorize(['ROLE.VIEW', 'USER.ASSIGN_ROLE']),
    adminRoleController.getRoleOptions
);

router.route('/roles/:id')
    .put(auth.auth(), auth.authorize(['ROLE.UPDATE']), validate(adminValidation.updateRole), adminRoleController.updateRole)
    .delete(auth.auth(), auth.authorize(['ROLE.DELETE']), validate(adminValidation.roleIdParam), adminRoleController.deleteRole);

router.patch('/roles/:id/restore',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.roleIdParam),
    adminRoleController.restoreRole
);

router.get('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.roleIdParam),
    adminRoleController.getRolePermissions
);

router.post('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.rolePermissionsBody),
    adminRoleController.addRolePermissions
);

router.put('/roles/:id/permissions',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.rolePermissionsBody),
    adminRoleController.replaceRolePermissions
);

router.delete('/roles/:id/permissions/:permissionId',
    auth.auth(),
    auth.authorize(['ROLE.UPDATE']),
    validate(adminValidation.deleteRolePermission),
    adminRoleController.removeRolePermission
);

router.route('/permissions')
    .post(auth.auth(), auth.authorize(['PERMISSION.CREATE']), validate(adminValidation.createPermission), adminRoleController.createPermission)
    .get(auth.auth(), auth.authorize(['PERMISSION.VIEW']), validate(adminValidation.getPermissions), adminRoleController.getPermissions);

router.get('/permissions/grouped', auth.auth(), auth.authorize(['PERMISSION.VIEW']), adminRoleController.getGroupedPermissions);

router.get('/audit-logs',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.getAuditLogs),
    adminSystemController.getAuditLogs
);

router.get('/audit-logs/:id',
    auth.auth(),
    auth.authorize(['ROLE.VIEW']),
    validate(adminValidation.auditLogId),
    adminSystemController.getAuditLogById
);

router.get('/enums', auth.auth(), auth.authorize(['ROLE.VIEW']), adminSystemController.getAdminEnums);

module.exports = router;
