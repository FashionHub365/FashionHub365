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
        storeId,
        sort = 'newest',
        page = 1,
        limit = 9,
    } = query;

    // 1. Build filter
    const filter = { status: 'active' };

    // Filter theo storeId
    if (storeId) {
        filter.store_id = storeId;
    }

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
            .populate('store_id', 'name slug')
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
        .populate('store_id', 'name slug description rating_summary')
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
        .populate('store_id', 'name slug')
        .limit(parseInt(limit))
        .sort({ created_at: -1 });

    return products;
};

/**
 * Tạo sản phẩm cho người bán
 * @param {Object} productBody
 * @param {string} storeId
 * @returns {Promise<Product>}
 */
const createProductForSeller = async (productBody, storeId) => {
    // Generate slug from name
    const baseSlug = productBody.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return Product.create({
        ...productBody,
        store_id: storeId,
        slug,
        status: 'active' // Default to active for simplicity, can be changed to 'draft'
    });
};

/**
 * Lấy danh sách sản phẩm của người bán theo storeId
 * @param {string} storeId
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const querySellerProducts = async (storeId, filter, options) => {
    const { page = 1, limit = 10, search, status, primary_category_id } = filter;
    const query = { store_id: storeId };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    if (status && status !== 'all') {
        query.status = status;
    }
    if (primary_category_id && primary_category_id !== 'all') {
        query.primary_category_id = primary_category_id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
        Product.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Product.countDocuments(query)
    ]);

    return {
        products,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
    };
};

/**
 * Lấy chi tiết sản phẩm của người bán (có kiểm tra storeId)
 * @param {string} productId
 * @param {string} storeId
 * @returns {Promise<Product>}
 */
const getProductByIdForSeller = async (productId, storeId) => {
    const product = await Product.findOne({ _id: productId, store_id: storeId });
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy sản phẩm trong cửa hàng của bạn.');
    }
    return product;
};

/**
 * Cập nhật sản phẩm cho người bán
 * @param {string} productId
 * @param {string} storeId
 * @param {Object} updateBody
 * @returns {Promise<Product>}
 */
const updateProductBySeller = async (productId, storeId, updateBody) => {
    const product = await getProductByIdForSeller(productId, storeId);
    
    // Nếu đổi tên, cập nhật lại slug
    if (updateBody.name && updateBody.name !== product.name) {
        const baseSlug = updateBody.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const existing = await Product.findOne({ slug: baseSlug, _id: { $ne: productId } });
        updateBody.slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    Object.assign(product, updateBody);
    await product.save();
    return product;
};

/**
 * Xóa sản phẩm cho người bán
 * @param {string} productId
 * @param {string} storeId
 * @returns {Promise<Product>}
 */
const deleteProductBySeller = async (productId, storeId) => {
    const product = await getProductByIdForSeller(productId, storeId);
    await product.deleteOne();
    return product;
};

/**
 * Bật/tắt trạng thái kinh doanh của sản phẩm
 * @param {string} productId
 * @param {string} storeId
 * @returns {Promise<Product>}
 */
const toggleProductStatusBySeller = async (productId, storeId) => {
    const product = await getProductByIdForSeller(productId, storeId);
    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();
    return product;
};

module.exports = {
    getPublicProducts,
    getAllCategories,
    getPublicProductById,
    getRecommendedProducts,
    createProductForSeller,
    querySellerProducts,
    getProductByIdForSeller,
    updateProductBySeller,
    deleteProductBySeller,
    toggleProductStatusBySeller
};
