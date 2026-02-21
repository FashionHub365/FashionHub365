const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller');

// UC-50: Thống kê hệ thống
router.get('/stats', adminController.getSystemStats);

// Quản lý danh mục (Admin)
router.get('/categories', categoryController.getCategories);          // Lấy tất cả
router.post('/categories', categoryController.createCategory);        // Tạo mới
router.put('/categories/:id', categoryController.updateCategory);     // Cập nhật
router.delete('/categories/:id', categoryController.deleteCategory);  // Xóa

module.exports = router;
