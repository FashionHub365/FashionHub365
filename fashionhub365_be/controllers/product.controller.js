const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { productService } = require('../services');
const { StoreMember, Store } = require('../models');
const { validateProductData } = require('../utils/validation');

/**
 * Helper to get storeId for the logged in user
 */
const getStoreIdForUser = async (user) => {
    // 1. Check StoreMember table (for staff/invited members)
    const member = await StoreMember.findOne({ user_id: user._id, status: 'ACTIVE' });
    if (member) {
        return member.store_id;
    }

    // 2. Check Store table directly (for owners)
    const store = await Store.findOne({ owner_user_id: user._id, status: 'active' });
    if (store) {
        return store._id;
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'Bạn không thuộc về bất kỳ cửa hàng nào để thực hiện thao tác này.');
};

/**
 * UC-09: Đăng bán sản phẩm
 */
const createProduct = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    
    // Inject store_id for validation
    const productData = { ...req.body, store_id: storeId.toString() };
    
    const { isValid, errors } = validateProductData(productData);
    if (!isValid) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Dữ liệu không hợp lệ', errors);
    }

    const product = await productService.createProductForSeller(req.body, storeId);
    res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Sản phẩm đã được tạo thành công.',
        data: product
    });
});

/**
 * UC-16: Quản lý danh sách sản phẩm (Lọc theo store của seller)
 */
const getSellerProducts = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    const result = await productService.querySellerProducts(storeId, req.query);
    res.json({
        success: true,
        data: result
    });
});

/**
 * UC-16: Lấy chi tiết 1 sản phẩm (Có check store owner)
 */
const getProductById = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    const product = await productService.getProductByIdForSeller(req.params.id, storeId);
    res.json({
        success: true,
        data: product
    });
});

/**
 * UC-11: Cập nhật sản phẩm
 */
const updateProduct = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    const product = await productService.updateProductBySeller(req.params.id, storeId, req.body);
    res.json({
        success: true,
        message: 'Cập nhật sản phẩm thành công.',
        data: product
    });
});

/**
 * UC-12: Xóa sản phẩm
 */
const deleteProduct = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    await productService.deleteProductBySeller(req.params.id, storeId);
    res.json({
        success: true,
        message: 'Xóa sản phẩm thành công.'
    });
});

/**
 * UC-15: Bật/tắt trạng thái kinh doanh
 */
const toggleStockStatus = catchAsync(async (req, res) => {
    const storeId = await getStoreIdForUser(req.user);
    const product = await productService.toggleProductStatusBySeller(req.params.id, storeId);
    res.json({
        success: true,
        message: `Đã chuyển trạng thái sang "${product.status}".`,
        data: product
    });
});

module.exports = {
    createProduct,
    getSellerProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    toggleStockStatus
};

