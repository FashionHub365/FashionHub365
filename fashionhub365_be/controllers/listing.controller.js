const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { productService, storeService } = require('../services');

/**
 * GET /api/v1/listing/products
 * Lấy danh sách sản phẩm công khai cho trang Listing
 * Params: category, color, size, search, sort, page, limit
 */
const getProducts = catchAsync(async (req, res) => {
    const result = await productService.getPublicProducts(req.query);
    res.status(httpStatus.OK).send({
        success: true,
        data: result,
    });
});

/**
 * GET /api/v1/listing/categories
 * Lấy danh sách categories để hiển thị trong FilterSidebar
 */
const getCategories = catchAsync(async (req, res) => {
    const categories = await productService.getAllCategories();
    res.status(httpStatus.OK).send({
        success: true,
        data: categories,
    });
});

/**
 * GET /api/v1/listing/products/:id
 * Lấy chi tiết 1 sản phẩm công khai (dùng cho trang Product Detail)
 */
const getProductById = catchAsync(async (req, res) => {
    const product = await productService.getPublicProductById(req.params.id);
    res.status(httpStatus.OK).send({
        success: true,
        data: product,
    });
});

/**
 * GET /api/v1/listing/products/:id/recommended
 * Lấy danh sách sản phẩm gợi ý (cùng category, loại trừ SP hiện tại)
 * Query: limit (default 4)
 */
const getRecommendedProducts = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Lấy thông tin SP để biết categoryId
    const product = await productService.getPublicProductById(id);
    const categoryId = product.primary_category_id?._id || product.primary_category_id;

    const recommended = await productService.getRecommendedProducts(categoryId, id, limit);
    res.status(httpStatus.OK).send({
        success: true,
        data: recommended,
    });
});

/**
 * GET /api/v1/listing/stores/:id
 * Lấy thông tin chi tiết 1 cửa hàng công khai
 */
const getStoreById = catchAsync(async (req, res) => {
    const store = await storeService.getPublicStoreById(req.params.id);
    res.status(httpStatus.OK).send({
        success: true,
        data: store,
    });
});

module.exports = {
    getProducts,
    getCategories,
    getProductById,
    getRecommendedProducts,
    getStoreById,
};
