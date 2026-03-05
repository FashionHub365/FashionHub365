const express = require('express');
const listingController = require('../controllers/listing.controller');

const router = express.Router();

// GET /api/v1/listing/products         - Danh sách SP công khai (không cần auth)
router.get('/products', listingController.getProducts);

// GET /api/v1/listing/products/:id     - Chi tiết 1 SP công khai (không cần auth)
router.get('/products/:id', listingController.getProductById);

// GET /api/v1/listing/products/:id/recommended - SP gợi ý (không cần auth)
router.get('/products/:id/recommended', listingController.getRecommendedProducts);

// GET /api/v1/listing/categories       - Danh sách categories (không cần auth)
router.get('/categories', listingController.getCategories);

module.exports = router;
