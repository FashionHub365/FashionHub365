const httpStatus = require('http-status');
const { Voucher, VoucherUsage, UserVoucher } = require('../models');
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
const getVouchers = async (query = {}, userId = null) => {
    const { page = 1, limit = 20, status, store_id } = query;
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

    if (store_id) {
        filter.store_id = { $in: [store_id, null] };
    }

    let [items, total] = await Promise.all([
        Voucher.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        Voucher.countDocuments(filter),
    ]);

    // If userId is provided, check which vouchers are already claimed
    if (userId && items.length > 0) {
        const claimed = await UserVoucher.find({
            user_id: userId,
            voucher_id: { $in: items.map(v => v._id) }
        });
        const claimedIds = new Set(claimed.map(c => c.voucher_id.toString()));
        items = items.map(v => ({
            ...v,
            isClaimed: claimedIds.has(v._id.toString())
        }));
    }

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
 * Claim a voucher for a user
 */
const claimVoucher = async (voucherId, userId) => {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found');
    }

    // Check validity
    const now = new Date();
    if (voucher.end_date && voucher.end_date < now) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher has expired');
    }
    if (voucher.used_count >= voucher.usage_limit) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher usage limit reached');
    }

    // Check if already claimed
    const existing = await UserVoucher.findOne({ user_id: userId, voucher_id: voucherId });
    if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher already claimed');
    }

    return UserVoucher.create({
        user_id: userId,
        voucher_id: voucherId,
        status: 'claimed'
    });
};

/**
 * Get vouchers owned by a user
 */
const getMyVouchers = async (userId) => {
    const userVouchers = await UserVoucher.find({ user_id: userId, status: 'claimed' })
        .populate('voucher_id')
        .sort({ claimed_at: -1 });

    return userVouchers.map(uv => uv.voucher_id).filter(v => v !== null);
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

    // Check if user owns / has access to this voucher
    // In some systems, anyone can use a code if they know it. 
    // In others, they MUST claim it first.
    // Let's check if they claimed it, if not, check if it's currently usable by anyone.
    const userVoucher = await UserVoucher.findOne({
        user_id: userId,
        voucher_id: voucher._id,
        status: 'claimed'
    });

    if (!userVoucher) {
        // Option: allow usage even if not claimed? Shopee usually requires claiming or automatic application.
        // Let's be strict for now if we want a "Wallet" feel.
        // throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher must be claimed first');
    }

    // Check if already used
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

    // Update UserVoucher status
    await UserVoucher.findOneAndUpdate(
        { user_id: userId, voucher_id: voucherId, status: 'claimed' },
        { status: 'used', used_at: new Date(), order_id: orderId }
    );
};

module.exports = {
    createVoucher,
    getVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    claimVoucher,
    getMyVouchers,
    applyVoucher,
    recordUsage,
};
