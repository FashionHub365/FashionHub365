const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');

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
 * POST /api/v1/listing/products/:id/view
 * Tăng view_count mỗi khi user xem Product Detail
 * Fire-and-forget: không block response nếu lỗi
 */
const trackProductView = catchAsync(async (req, res) => {
    // Không await để không block, lỗi không trả về 500
    productService.incrementViewCount(req.params.id).catch(() => { });
    res.status(httpStatus.OK).send({ success: true });
});

/**
 * GET /api/v1/listing/products/:id/reviews
 * Lấy danh sách reviews sản phẩm kèm summary
 */
const getProductReviews = catchAsync(async (req, res) => {
    const reviewsData = await productService.getProductReviews(req.params.id);
    res.status(httpStatus.OK).send({
        success: true,
        data: reviewsData,
    });
});

/**
 * POST /api/v1/listing/products/:id/reviews
 * Thêm review từ người dùng
 */
const createProductReview = catchAsync(async (req, res) => {
    // req.user được gán từ auth middleware
    const userId = req.user.id || req.user._id;
    const reviewData = req.body;

    const review = await productService.createProductReview(req.params.id, userId, reviewData);

    res.status(httpStatus.CREATED).send({
        success: true,
        data: review,
    });
});

module.exports = {
    getProducts,
    getCategories,
    getProductById,
    getRecommendedProducts,
    trackProductView,
    getProductReviews,
    createProductReview,
};
