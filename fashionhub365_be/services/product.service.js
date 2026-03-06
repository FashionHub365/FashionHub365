const httpStatus = require('http-status');
const { Product, Category, ProductReview } = require('../models');
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
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Query DB
    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('primary_category_id', 'name slug')
            .populate('brand_id', 'name')
            .populate('store_id', 'name')
            .populate('tag_ids', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit)),
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
        .populate('tag_ids', 'name')
        .populate('store_id', 'name');

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
        .limit(parseInt(limit))
        .sort({ created_at: -1 });

    return products;
};

/**
 * [CART RECOMMENDATION ENGINE] – Smart Cross-Sell theo rule ưu tiên (P1→P4)
 *
 * P1 – Cùng store, KHAÍC category, chưa có trong giỏ, còn hàng  → cross-sell
 * P2 – Free Shipping Nudge: đẩy SP có giá <= gap đến 1.000.000đ lên đầu
 * P3 – Cùng store, cùng category (fill nếu P1 chưa đủ)
 * P4 – Best-seller toàn hệ thống (fallback)
 *
 * @param {string[]} cartProductIds – IDs sản phẩm đạng trong giỏ
 * @param {string[]} storeIds       – IDs store xuất hiện trong giỏ
 * @param {string[]} categoryIds    – Category IDs tổng hợp của giỏ
 * @param {number}   cartTotal      – Tổng tiền giỏ hiện tại (VND)
 * @param {number}   limit          – Số sản phẩm tối đa (default 4)
 */
const getCartRecommendations = async ({
    cartProductIds = [], storeIds = [], categoryIds = [], cartTotal = 0, limit = 4,
}) => {
    const FREE_SHIP = 1_000_000;
    const gap = Math.max(0, FREE_SHIP - cartTotal);

    const formatProduct = (p) => {
        // Lấy variant có stock cao nhất (thay vì đầu tiên còn hàng)
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

    // Pool: sản phẩm cùng store, chưa có trong giỏ, còn hàng
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

    // P1: Cùng store, KHAÍC category
    const p1 = pool.filter(p => !p.categoryIds.some(cid => cartCatSet.has(cid)));
    // P3: Cùng store, cùng category
    const p1Set = new Set(p1.map(p => p._id.toString()));
    const p3 = pool.filter(p => !p1Set.has(p._id.toString()));

    // P4: Fallback best-seller toàn hệ thống
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

    // Merge: P1 → P3 → P4, rồi apply P2 (nudge lên đầu)
    let merged = [...p1, ...p3, ...p4];
    if (gap > 0 && gap < FREE_SHIP) {
        const nudge = merged.filter(p => p.helpsReachFreeShip);
        const rest = merged.filter(p => !p.helpsReachFreeShip);
        merged = [...nudge, ...rest];
    }

    // Deduplicate + giới hạn kết quả
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
 * Tăng view_count khi người dùng xem chi tiết sản phẩm
 * Dùng $inc để atomic update, không cần read-modify-write
 * @param {string} productId
 */
const incrementViewCount = async (productId) => {
    await Product.findByIdAndUpdate(
        productId,
        { $inc: { view_count: 1 } },
        { new: false } // không cần trả về document mới để tiết kiệm
    );
};

/**
 * Tăng sold_count khi order chuyển sang trạng thái 'delivered'
 * Gọi từ order.controller khi updateOrderStatus → delivered
 * @param {Array} items - Order items [{ productId, qty }]
 */
const incrementSoldCount = async (items) => {
    if (!items || items.length === 0) return;

    // Cập nhật song song tất cả sản phẩm trong đơn hàng
    const updates = items.map(item =>
        Product.findByIdAndUpdate(
            item.productId,
            { $inc: { sold_count: item.qty || 1 } },
            { new: false }
        )
    );
    await Promise.all(updates);
};

/**
 * Cập nhật rating trung bình của sản phẩm
 * Tính lại average sau mỗi lần có review mới
 * @param {string} productId
 * @param {number} newScore - điểm mới (1-5)
 */
const updateProductRating = async (productId, newScore) => {
    const product = await Product.findById(productId).select('rating');
    if (!product) return;

    const currentCount = product.rating?.count || 0;
    const currentAvg = product.rating?.average || 0;

    // Tính trung bình động: newAvg = (oldAvg * oldCount + newScore) / (oldCount + 1)
    const newCount = currentCount + 1;
    const newAverage = ((currentAvg * currentCount) + newScore) / newCount;

    await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(newAverage * 10) / 10, // làm tròn 1 chữ số thập phân
        'rating.count': newCount
    });
};

/**
 * Lấy reviews của 1 sản phẩm kèm thống kê breakdown
 * @param {string} productId 
 */
const getProductReviews = async (productId) => {
    const reviews = await ProductReview.find({ product_id: productId })
        .sort({ created_at: -1 })
        .lean();

    // Tính điểm breakdown (số sao -> đếm)
    const breakdowns = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach(rv => {
        if (breakdowns[rv.rating] !== undefined) {
            breakdowns[rv.rating]++;
        }
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
 * Thêm một review mới cho sản phẩm
 * @param {string} productId 
 * @param {string} userId 
 * @param {Object} reviewData 
 */
const createProductReview = async (productId, userId, reviewData) => {
    const { Order, Product } = require('../models');

    // Mặc định tên
    let finalReviewerInfo = {
        name: reviewData.reviewer_info?.name || 'Anonymous'
    };

    // Tìm Order đã giao của user chứa sản phẩm này
    const order = await Order.findOne({
        user_id: userId,
        'items.productId': productId,
        status: { $in: ['delivered'] }
    });

    if (order) {
        // Nếu đã mua, cố gắng bóc tách size đã mua từ khoá variant
        const item = order.items.find(i => i.productId.toString() === productId.toString());
        if (item && item.variantId) {
            const product = await Product.findById(productId);
            if (product) {
                const variant = product.variants.id(item.variantId) || product.variants.find(v => v._id.toString() === item.variantId.toString());
                if (variant && variant.attributes && variant.attributes.size) {
                    finalReviewerInfo.size_purchased = variant.attributes.size;
                }
            }
        }
    }

    // Nếu hệ thống không tìm được size trong lịch sử mua (hoặc khách chưa mua),
    // Thì mới cho phép dùng size khách tự nhập từ form
    if (!finalReviewerInfo.size_purchased && reviewData.reviewer_info?.size_purchased) {
        finalReviewerInfo.size_purchased = reviewData.reviewer_info.size_purchased;
    }

    const review = await ProductReview.create({
        product_id: productId,
        user_id: userId,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        verified_purchase: !!order,
        reviewer_info: finalReviewerInfo
    });

    // Update product average rating
    await updateProductRating(productId, reviewData.rating);

    return review;
};

module.exports = {
    getPublicProducts,
    getAllCategories,
    getPublicProductById,
    getRecommendedProducts,
    getCartRecommendations,
    incrementViewCount,
    incrementSoldCount,
    updateProductRating,
    getProductReviews,
    createProductReview,
};
