const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');
const auth = require("../middleware/auth");
const { storeAuth } = require("../middleware/storeAuth");

// UC-09: Đăng bán sản phẩm
router.post('/', auth.auth(), storeAuth(), productController.createProduct);

// UC-16: Quản lý danh sách sản phẩm
router.get('/seller', auth.auth(), storeAuth(), productController.getSellerProducts);
router.get('/cart-recommendations', catchAsync(async (req, res) => {
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
router.get('/:id', productController.getProductById);
router.put('/:id', auth.auth(), storeAuth(), productController.updateProduct);
router.delete('/:id', auth.auth(), storeAuth(), productController.deleteProduct);
router.patch('/:id/stock-status', auth.auth(), storeAuth(), productController.toggleStockStatus);

module.exports = router;

