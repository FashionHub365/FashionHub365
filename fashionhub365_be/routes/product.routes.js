const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { auth, authorize } = require('../middleware/auth');
const { storeAuth } = require("../middleware/storeAuth");
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');

// Tất cả các route trong file này yêu cầu đăng nhập
router.use(auth());

// UC-09: Đăng bán sản phẩm
router.post('/', storeAuth(), authorize(['STORE.PRODUCT.CREATE']), productController.createProduct);

// UC-16: Quản lý danh sách sản phẩm
router.get('/seller', storeAuth(), authorize(['STORE.PRODUCT.VIEW']), productController.getSellerProducts);

// Gợi ý sản phẩm cho giỏ hàng
router.get('/cart-recommendations', authorize(['CART.MANAGE']), catchAsync(async (req, res) => {
    const { cartProductIds, storeIds, categoryIds, cartTotal, limit } = req.query;

    const result = await productService.getCartRecommendations({
        cartProductIds: cartProductIds ? cartProductIds.split(',').filter(Boolean) : [],
        storeIds: storeIds ? storeIds.split(',').filter(Boolean) : [],
        categoryIds: categoryIds ? categoryIds.split(',').filter(Boolean) : [],
        cartTotal: parseFloat(cartTotal || '0'),
        limit: parseInt(limit || '4'),
    });

    res.json({ success: true, data: result });
}));

// Chi tiết sản phẩm, cập nhật, xóa, trạng thái kho (Yêu cầu storeAuth)
router.get('/:id', storeAuth(), authorize(['STORE.PRODUCT.VIEW']), productController.getProductById);
router.put('/:id', storeAuth(), authorize(['STORE.PRODUCT.UPDATE']), productController.updateProduct);
router.delete('/:id', storeAuth(), authorize(['STORE.PRODUCT.DELETE']), productController.deleteProduct);
router.patch('/:id/stock-status', storeAuth(), authorize(['STORE.PRODUCT.UPDATE']), productController.toggleStockStatus);

// Reviews management for sellers
router.get('/:id/reviews', storeAuth(), authorize(['STORE.PRODUCT.VIEW']), productController.getSellerProductReviews);
router.post('/:id/reviews/:reviewId/respond', storeAuth(), authorize(['STORE.PRODUCT.UPDATE']), productController.respondToReview);
router.patch('/:id/reviews/:reviewId/toggle-visibility', storeAuth(), authorize(['STORE.PRODUCT.UPDATE']), productController.toggleReviewVisibility);

module.exports = router;

