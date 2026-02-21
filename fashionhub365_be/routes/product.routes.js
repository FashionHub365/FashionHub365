const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// UC-09: Đăng bán sản phẩm
router.post('/', productController.createProduct);

// UC-16: Quản lý danh sách sản phẩm
router.get('/seller', productController.getSellerProducts);          // Lấy danh sách SP
router.get('/:id', productController.getProductById);               // Lấy chi tiết SP
router.put('/:id', productController.updateProduct);                // Cập nhật SP
router.delete('/:id', productController.deleteProduct);             // Xóa SP
router.patch('/:id/stock-status', productController.toggleStockStatus); // Bật/tắt hết hàng

module.exports = router;
