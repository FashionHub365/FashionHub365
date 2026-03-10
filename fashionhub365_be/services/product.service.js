const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Product, Category, ProductReview, Store } = require('../models');
const ApiError = require('../utils/ApiError');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 9, 1);

    // 1. Build filter
    const filter = { status: 'active' };

    // Filter theo storeId (ho tro ca ObjectId va UUID)
    if (storeId) {
        let resolvedStoreId = null;

        if (mongoose.Types.ObjectId.isValid(storeId)) {
            resolvedStoreId = storeId;
        } else {
            const store = await Store.findOne({ $or: [{ uuid: storeId }, { slug: storeId }] }).select('_id');
            if (store) resolvedStoreId = store._id;
        }

        if (!resolvedStoreId) {
            return {
                products: [],
                total: 0,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: 0,
            };
        }

        filter.store_id = resolvedStoreId;
    }

    // Filter theo category slug, id hoac name
    if (category) {
        let cat = null;

        if (mongoose.Types.ObjectId.isValid(category)) {
            cat = await Category.findById(category).select('_id');
        }

        if (!cat) {
            cat = await Category.findOne({ slug: category }).select('_id');
        }

        if (!cat) {
            cat = await Category.findOne({ name: new RegExp(`^${escapeRegex(category)}$`, 'i') }).select('_id');
        }

        if (cat) {
            filter.$or = [
                { category_ids: cat._id },
                { primary_category_id: cat._id },
            ];
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
        case 'best_sellers':
            sortOption = { sold_count: -1 };
            break;
        case 'top_rated':
            sortOption = { 'rating.average': -1, 'rating.count': -1 };
            break;
        case 'most_viewed':
            sortOption = { view_count: -1 };
            break;
        case 'newest':
        default:
            sortOption = { created_at: -1 };
            break;
    }

    // 3. Pagination
    const skip = (parsedPage - 1) * parsedLimit;

    // 4. Query DB
    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('primary_category_id', 'name slug')
            .populate('brand_id', 'name')
            .populate('store_id', 'name slug description rating_summary')
            .populate('tag_ids', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parsedLimit),
        Product.countDocuments(filter),
    ]);

    // ── TÍNH TOÁN BADGE ĐỘNG DỰA TRÊN DỮ LIỆU THẬT ──
    const topViewed = await Product.find({ status: 'active' })
        .sort({ view_count: -1 })
        .limit(10)
        .select('_id view_count');
    const trendingIds = topViewed.filter(p => p.view_count > 0).map(p => p._id.toString());

    const uniqueCatIds = [...new Set(products.map(p => p.primary_category_id?._id?.toString() || p.primary_category_id?.toString()))].filter(Boolean);
    const bestSellerIdsObj = {};

    await Promise.all(uniqueCatIds.map(async (catId) => {
        const topSold = await Product.find({ status: 'active', primary_category_id: catId })
            .sort({ sold_count: -1 })
            .limit(10)
            .select('_id sold_count');

        topSold.forEach(p => {
            if (p.sold_count > 0) {
                bestSellerIdsObj[p._id.toString()] = true;
            }
        });
    }));

    const finalProducts = products.map(p => {
        const pObj = p.toObject();
        pObj.isTrending = trendingIds.includes(pObj._id.toString());
        pObj.isBestSeller = !!bestSellerIdsObj[pObj._id.toString()];
        const daysSinceCreated = (Date.now() - new Date(pObj.created_at || Date.now()).getTime()) / (1000 * 3600 * 24);
        pObj.isNewArrival = daysSinceCreated <= 30;
        return pObj;
    });

    return {
        products: finalProducts,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
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

    // Tính toán badge động
    const topViewed = await Product.find({ status: 'active' }).sort({ view_count: -1 }).limit(10).select('_id');
    const trendingIds = topViewed.map(p => p._id.toString());

    let isBestSeller = false;
    if (product.primary_category_id && product.sold_count > 0) {
        const topSold = await Product.find({ status: 'active', primary_category_id: product.primary_category_id._id || product.primary_category_id })
            .sort({ sold_count: -1 }).limit(10).select('_id');
        isBestSeller = topSold.some(p => p._id.toString() === product._id.toString());
    }

    const pObj = product.toObject();
    pObj.isTrending = trendingIds.includes(pObj._id.toString());
    pObj.isBestSeller = isBestSeller;

    const daysSinceCreated = (Date.now() - new Date(pObj.created_at || Date.now()).getTime()) / (1000 * 3600 * 24);
    pObj.isNewArrival = daysSinceCreated <= 30;

    return pObj;
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
 * [CART RECOMMENDATION ENGINE] – Smart Cross-Sell theo rule ưu tiên (P1→P4)
 */
const getCartRecommendations = async ({
    cartProductIds = [], storeIds = [], categoryIds = [], cartTotal = 0, limit = 4,
}) => {
    const FREE_SHIP = 1_000_000;
    const gap = Math.max(0, FREE_SHIP - cartTotal);

    const formatProduct = (p) => {
        const v = (p.variants || [])
            .filter(vr => vr.stock > 0)
            .sort((a, b) => (b.stock || 0) - (a.stock || 0))[0];
        if (!v) return null;
        const price = v.price || p.base_price;
        return {
            _id: p._id,
            name: p.name,
            slug: p.slug,
            price,
            variantName: v.variantName || '',
            variantId: v._id,
            image: (p.media || []).find(m => m.isPrimary)?.url || p.media?.[0]?.url || '',
            rating: p.rating?.average || 0,
            soldCount: p.sold_count || 0,
            categoryIds: (p.category_ids || []).map(c => c.toString()),
            helpsReachFreeShip: gap > 0 && gap < FREE_SHIP && price <= gap,
        };
    };

    let pool = [];
    if (storeIds.length > 0) {
        const raw = await Product.find({
            status: 'active',
            store_id: { $in: storeIds },
            _id: { $nin: cartProductIds },
            'variants.stock': { $gt: 0 },
        })
            .select('name slug base_price media variants rating sold_count category_ids store_id')
            .sort({ 'rating.average': -1, sold_count: -1 })
            .limit(50);
        pool = raw.map(formatProduct).filter(Boolean);
    }

    const cartCatSet = new Set(categoryIds.map(c => c.toString()));
    const p1 = pool.filter(p => !p.categoryIds.some(cid => cartCatSet.has(cid)));
    const p1Set = new Set(p1.map(p => p._id.toString()));
    const p3 = pool.filter(p => !p1Set.has(p._id.toString()));

    const usedIds = new Set([...cartProductIds.map(String), ...pool.map(p => p._id.toString())]);
    let p4 = [];
    if (p1.length + p3.length < limit) {
        const fb = await Product.find({
            status: 'active',
            _id: { $nin: Array.from(usedIds) },
            'variants.stock': { $gt: 0 },
        })
            .select('name slug base_price media variants rating sold_count category_ids store_id')
            .sort({ sold_count: -1, 'rating.average': -1 })
            .limit(20);
        p4 = fb.map(formatProduct).filter(Boolean);
    }

    let merged = [...p1, ...p3, ...p4];
    if (gap > 0 && gap < FREE_SHIP) {
        const nudge = merged.filter(p => p.helpsReachFreeShip);
        const rest = merged.filter(p => !p.helpsReachFreeShip);
        merged = [...nudge, ...rest];
    }

    const seen = new Set();
    const result = [];
    for (const p of merged) {
        const key = p._id.toString();
        if (!seen.has(key)) { seen.add(key); result.push(p); }
        if (result.length >= limit) break;
    }

    return {
        products: result,
        meta: {
            freeShipThreshold: FREE_SHIP,
            cartTotal,
            gap,
            showFreeShipNudge: gap > 0 && gap < FREE_SHIP,
        },
    };
};

/**
 * Lấy chi tiết sản phẩm của người bán (có kiểm tra storeId)
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
 */
const updateProductBySeller = async (productId, storeId, updateBody) => {
    const product = await getProductByIdForSeller(productId, storeId);
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
 */
const deleteProductBySeller = async (productId, storeId) => {
    const product = await getProductByIdForSeller(productId, storeId);
    await product.deleteOne();
    return product;
};

/**
 * Bật/tắt trạng thái kinh doanh của sản phẩm
 */
const toggleProductStatusBySeller = async (productId, storeId) => {
    const product = await getProductByIdForSeller(productId, storeId);
    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();
    return product;
};

/**
 * Tăng view_count
 */
const incrementViewCount = async (productId) => {
    await Product.findByIdAndUpdate(productId, { $inc: { view_count: 1 } }, { new: false });
};

/**
 * Tăng sold_count
 */
const incrementSoldCount = async (items) => {
    if (!items || items.length === 0) return;
    const updates = items.map(item =>
        Product.findByIdAndUpdate(item.productId, { $inc: { sold_count: item.qty || 1 } }, { new: false })
    );
    await Promise.all(updates);
};

/**
 * Cập nhật rating trung bình
 */
const updateProductRating = async (productId, newScore) => {
    const product = await Product.findById(productId).select('rating');
    if (!product) return;
    const currentCount = product.rating?.count || 0;
    const currentAvg = product.rating?.average || 0;
    const newCount = currentCount + 1;
    const newAverage = ((currentAvg * currentCount) + newScore) / newCount;
    await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(newAverage * 10) / 10,
        'rating.count': newCount
    });
};

/**
 * Lấy reviews
 */
const getProductReviews = async (productId) => {
    const reviews = await ProductReview.find({ product_id: productId }).sort({ created_at: -1 }).lean();
    const breakdowns = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    reviews.forEach(rv => {
        if (breakdowns[rv.rating] !== undefined) breakdowns[rv.rating]++;
        totalScore += rv.rating;
    });
    const totalReviews = reviews.length;
    const averageScore = totalReviews > 0 ? (totalScore / totalReviews).toFixed(1) : 0;
    return {
        reviews: reviews.map(r => ({
            ...r,
            daysAgo: Math.max(0, Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 3600 * 24)))
        })),
        summary: {
            average: parseFloat(averageScore),
            count: totalReviews,
            breakdowns: Object.keys(breakdowns).sort((a, b) => b - a).map(star => ({
                stars: parseInt(star),
                count: breakdowns[star]
            }))
        }
    };
};

/**
 * Thêm một review mới
 */
const createProductReview = async (productId, userId, reviewData) => {
    const { Order, Product } = require('../models');
    let finalReviewerInfo = { name: reviewData.reviewer_info?.name || 'Anonymous' };
    const order = await Order.findOne({ user_id: userId, 'items.productId': productId, status: 'delivered' });
    if (order) {
        const item = order.items.find(i => i.productId.toString() === productId.toString());
        if (item && item.variantId) {
            const product = await Product.findById(productId);
            if (product) {
                const variant = product.variants.id(item.variantId) || product.variants.find(v => v._id.toString() === item.variantId.toString());
                if (variant && variant.attributes && variant.attributes.size) finalReviewerInfo.size_purchased = variant.attributes.size;
            }
        }
    }
    if (!finalReviewerInfo.size_purchased && reviewData.reviewer_info?.size_purchased) {
        finalReviewerInfo.size_purchased = reviewData.reviewer_info.size_purchased;
    }
    const review = await ProductReview.create({
        product_id: productId, user_id: userId, rating: reviewData.rating,
        title: reviewData.title, content: reviewData.content, verified_purchase: !!order, reviewer_info: finalReviewerInfo
    });
    await updateProductRating(productId, reviewData.rating);
    return review;
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
    toggleProductStatusBySeller,
    getCartRecommendations,
    incrementViewCount,
    incrementSoldCount,
    updateProductRating,
    getProductReviews,
    createProductReview,
};
