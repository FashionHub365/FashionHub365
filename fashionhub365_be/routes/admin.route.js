const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const adminValidation = require('../validations/admin.validation');
const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller'); // Added

const router = express.Router();

// UC-50: Thống kê hệ thống
router.get('/stats', auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getSystemStats);

// Quản lý danh mục (Admin)
router.get('/categories', categoryController.getCategories);          // Lấy tất cả (public for users to see categories)
router.post('/categories', auth.auth(), auth.authorize(['ROLE.ADMIN']), categoryController.createCategory);        // Tạo mới
router.put('/categories/:id', auth.auth(), auth.authorize(['ROLE.ADMIN']), categoryController.updateCategory);     // Cập nhật
router.delete('/categories/:id', auth.auth(), auth.authorize(['ROLE.ADMIN']), categoryController.deleteCategory);  // Xóa

router.route('/roles')
    .post(auth.auth(), auth.authorize(['ROLE.CREATE']), validate(adminValidation.createRole), adminController.createRole)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getRoles);

router.route('/permissions')
    .post(auth.auth(), auth.authorize(['PERMISSION.CREATE']), adminController.createPermission)
    .get(auth.auth(), auth.authorize(['PERMISSION.VIEW']), adminController.getPermissions);

router.post('/users/:userId/global-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignGlobalRole),
    adminController.assignGlobalRole
);

router.post('/users/:userId/store-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignStoreRole),
    adminController.assignStoreRole
);

module.exports = router;
