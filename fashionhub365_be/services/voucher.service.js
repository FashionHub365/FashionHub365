const httpStatus = require('http-status');
const { Voucher, VoucherUsage } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a voucher (admin/seller)
 */
const createVoucher = async (data) => {
    const existing = await Voucher.findOne({ code: data.code.toUpperCase() });
    if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher code already exists');
    }
    data.code = data.code.toUpperCase();
    return Voucher.create(data);
};

/**
 * Get all vouchers with pagination
 */
const getVouchers = async (query = {}) => {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter = {};
    if (status === 'active') {
        filter.start_date = { $lte: now };
        filter.end_date = { $gte: now };
        filter.$expr = { $lt: ['$used_count', '$usage_limit'] };
    } else if (status === 'expired') {
        filter.end_date = { $lt: now };
    }

    const [items, total] = await Promise.all([
        Voucher.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
        Voucher.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

/**
 * Get voucher by ID
 */
const getVoucherById = async (voucherId) => {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found');
    }
    return voucher;
};

/**
 * Update voucher
 */
const updateVoucher = async (voucherId, data) => {
    const voucher = await Voucher.findByIdAndUpdate(voucherId, data, { new: true, runValidators: true });
    if (!voucher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found');
    }
    return voucher;
};

/**
 * Delete voucher
 */
const deleteVoucher = async (voucherId) => {
    const result = await Voucher.findByIdAndDelete(voucherId);
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found');
    }
};

/**
 * Validate & apply voucher at checkout
 */
const applyVoucher = async (code, userId, orderAmount) => {
    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found');
    }

    const now = new Date();

    // Check date validity
    if (voucher.start_date && voucher.start_date > now) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher is not yet active');
    }
    if (voucher.end_date && voucher.end_date < now) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher has expired');
    }

    // Check usage limit
    if (voucher.used_count >= voucher.usage_limit) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher usage limit reached');
    }

    // Check min order amount
    if (orderAmount < voucher.min_order_amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Minimum order amount is ${voucher.min_order_amount}`);
    }

    // Check if user already used this voucher
    const alreadyUsed = await VoucherUsage.findOne({ voucher_id: voucher._id, user_id: userId });
    if (alreadyUsed) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already used this voucher');
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discount_type === 'percent') {
        discount = Math.round(orderAmount * voucher.discount_value / 100);
    } else {
        discount = voucher.discount_value;
    }

    // Discount cannot exceed order amount
    discount = Math.min(discount, orderAmount);

    return {
        voucher,
        discount,
        finalAmount: orderAmount - discount,
    };
};

/**
 * Record voucher usage after order is placed
 */
const recordUsage = async (voucherId, userId, orderId) => {
    await Voucher.findByIdAndUpdate(voucherId, { $inc: { used_count: 1 } });
    await VoucherUsage.create({
        voucher_id: voucherId,
        user_id: userId,
        order_id: orderId,
    });
};

module.exports = {
    createVoucher,
    getVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    applyVoucher,
    recordUsage,
};
