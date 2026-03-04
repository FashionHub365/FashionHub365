const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { auth } = require('../middleware/auth');

// Tất cả các route trong file này yêu cầu đăng nhập và quyền liên quan đến sản phẩm
router.use(auth());

// UC-09: Đăng bán sản phẩm
router.post('/', productController.createProduct);

// UC-16: Quản lý danh sách sản phẩm (Lấy danh sách SP của chính người bán)
router.get('/seller', productController.getSellerProducts);

// Lấy chi tiết 1 sản phẩm của người bán
router.get('/:id', productController.getProductById);

// UC-11: Cập nhật sản phẩm
router.put('/:id', productController.updateProduct);

// UC-12: Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

// UC-15: Bật/tắt trạng thái kinh doanh (Hết hàng/Còn hàng)
router.patch('/:id/stock-status', productController.toggleStockStatus);

module.exports = router;
