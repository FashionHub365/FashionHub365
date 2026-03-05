const httpStatus = require('http-status');
const { Product, Category } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách sản phẩm công khai cho trang Listing
 * Hỗ trợ filter: category, color, size, search, sort, page, limit
 * @param {Object} query - Query params từ request
 * @returns {Promise<Object>}
 */
const getPublicProducts = async (query) => {
    const {
        category,
        color,
        size,
        search,
        sort = 'newest',
        page = 1,
        limit = 9,
    } = query;

    // 1. Build filter
    const filter = { status: 'active' };

    // Filter theo category slug hoặc id
    if (category) {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
            filter.category_ids = cat._id;
        }
    }

    // Filter theo màu sắc (trong variants.attributes.color)
    if (color) {
        filter['variants.attributes.color'] = { $regex: color, $options: 'i' };
    }

    // Filter theo kích thước (trong variants.attributes.size)
    if (size) {
        filter['variants.attributes.size'] = { $regex: size, $options: 'i' };
    }

    // Tìm kiếm theo tên
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    // 2. Build sort
    let sortOption = {};
    switch (sort) {
        case 'price_asc':
            sortOption = { base_price: 1 };
            break;
        case 'price_desc':
            sortOption = { base_price: -1 };
            break;
        case 'newest':
        default:
            sortOption = { created_at: -1 };
            break;
    }

    // 3. Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Query DB
    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('primary_category_id', 'name slug')
            .populate('brand_id', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit)),
        Product.countDocuments(filter),
    ]);

    return {
        products,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
    };
};

/**
 * Lấy danh sách categories (chỉ root hoặc toàn bộ)
 * @returns {Promise<Array>}
 */
const getAllCategories = async () => {
    const categories = await Category.find()
        .select('name slug parent_id')
        .sort({ name: 1 });
    return categories;
};

/**
 * Lấy chi tiết 1 sản phẩm công khai theo ID (dùng cho trang Product Detail)
 * @param {string} productId
 * @returns {Promise<Product>}
 */
const getPublicProductById = async (productId) => {
    const product = await Product.findOne({ _id: productId, status: 'active' })
        .populate('primary_category_id', 'name slug')
        .populate('brand_id', 'name')
        .populate('tag_ids', 'name');

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy sản phẩm.');
    }
    return product;
};

/**
 * Lấy danh sách sản phẩm gợi ý (cùng category, loại trừ SP hiện tại)
 * @param {string} categoryId
 * @param {string} excludeId - ID sản phẩm hiện tại cần loại trừ
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getRecommendedProducts = async (categoryId, excludeId, limit = 4) => {
    const products = await Product.find({
        status: 'active',
        category_ids: categoryId,
        _id: { $ne: excludeId },
    })
        .populate('primary_category_id', 'name slug')
        .populate('brand_id', 'name')
        .limit(parseInt(limit))
        .sort({ created_at: -1 });

    return products;
};

module.exports = {
    getPublicProducts,
    getAllCategories,
    getPublicProductById,
    getRecommendedProducts,
};
