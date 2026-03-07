const express = require('express');
const listingController = require('../controllers/listing.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/listing/products         - Danh sách SP công khai (không cần auth)
router.get('/products', listingController.getProducts);

// GET /api/v1/listing/products/:id     - Chi tiết 1 SP công khai (không cần auth)
router.get('/products/:id', listingController.getProductById);

// GET /api/v1/listing/products/:id/recommended - SP gợi ý (không cần auth)
router.get('/products/:id/recommended', listingController.getRecommendedProducts);

// GET /api/v1/listing/categories       - Danh sách categories (không cần auth)
router.get('/categories', listingController.getCategories);

// GET /api/v1/listing/stores/:id         - Thông tin chi tiết shop công khai
router.get('/stores/:id', listingController.getStoreById);

// POST /api/v1/listing/products/:id/view - Tăng view_count (fire-and-forget, không cần auth)
router.post('/products/:id/view', listingController.trackProductView);

// GET /api/v1/listing/products/:id/reviews - Lấy danh sách đánh giá
router.get('/products/:id/reviews', listingController.getProductReviews);

// POST /api/v1/listing/products/:id/reviews - Thêm một đánh giá mới (cần đăng nhập)
router.post('/products/:id/reviews', auth.auth(), listingController.createProductReview);

module.exports = router;
