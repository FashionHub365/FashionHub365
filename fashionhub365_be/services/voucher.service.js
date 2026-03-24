const httpStatus = require('http-status');
const { Voucher, VoucherUsage, UserVoucher } = require('../models');
const ApiError = require('../utils/ApiError');

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeNumber = (value, fallback = undefined) => {
    if (value === undefined) {
        return fallback;
    }
    if (value === null || value === '') {
        return fallback;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeDate = (value, boundary) => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null || value === '') {
        return null;
    }

    const rawValue = typeof value === 'string' ? value.trim() : value;
    if (!rawValue) {
        return null;
    }

    if (typeof rawValue === 'string' && DATE_ONLY_REGEX.test(rawValue)) {
        const suffix = boundary === 'end' ? 'T23:59:59.999' : 'T00:00:00.000';
        return new Date(`${rawValue}${suffix}`);
    }

    return new Date(rawValue);
};

const determineVoucherStatus = (voucher, now = new Date()) => {
    if (voucher.end_date && new Date(voucher.end_date) < now) {
        return 'expired';
    }
    if (voucher.used_count >= voucher.usage_limit) {
        return 'exhausted';
    }
    if (voucher.start_date && new Date(voucher.start_date) > now) {
        return 'scheduled';
    }
    return 'active';
};

const presentVoucher = (voucher) => ({
    ...voucher,
    min_order_value: voucher.min_order_amount ?? 0,
    status: determineVoucherStatus(voucher),
});

const normalizeVoucherPayload = (data = {}) => {
    const payload = { ...data };

    if (payload.code !== undefined) {
        payload.code = `${payload.code}`.trim().toUpperCase();
    }

    if (payload.name !== undefined) {
        payload.name = `${payload.name}`.trim();
    }

    if (payload.description !== undefined) {
        payload.description = `${payload.description}`.trim();
    }

    if (payload.min_order_amount === undefined && payload.min_order_value !== undefined) {
        payload.min_order_amount = payload.min_order_value;
    }
    delete payload.min_order_value;

    if (payload.discount_value !== undefined) {
        payload.discount_value = normalizeNumber(payload.discount_value, payload.discount_value);
    }
    if (payload.min_order_amount !== undefined) {
        payload.min_order_amount = normalizeNumber(payload.min_order_amount, 0);
    }
    if (payload.usage_limit !== undefined) {
        payload.usage_limit = normalizeNumber(payload.usage_limit, 1);
    }
    if (payload.used_count !== undefined) {
        payload.used_count = normalizeNumber(payload.used_count, undefined);
    }
    if (payload.max_discount !== undefined) {
        payload.max_discount = normalizeNumber(payload.max_discount, null);
    }
    if (payload.start_date !== undefined) {
        payload.start_date = normalizeDate(payload.start_date, 'start');
    }
    if (payload.end_date !== undefined) {
        payload.end_date = normalizeDate(payload.end_date, 'end');
    }

    if (payload.discount_type !== undefined && payload.discount_type !== 'percent') {
        payload.max_discount = null;
    }

    if (payload.start_date instanceof Date && Number.isNaN(payload.start_date.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid voucher start date');
    }

    if (payload.end_date instanceof Date && Number.isNaN(payload.end_date.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid voucher end date');
    }

    if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher end date must be after start date');
    }

    return payload;
};

/**
 * Create a voucher (admin/seller)
 */
const createVoucher = async (data) => {
    const payload = normalizeVoucherPayload(data);
    const existing = await Voucher.findOne({ code: payload.code });
    if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Voucher code already exists');
    }
    return Voucher.create(payload);
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
        filter.$and = [
            { $or: [{ start_date: { $exists: false } }, { start_date: null }, { start_date: { $lte: now } }] },
            { $or: [{ end_date: { $exists: false } }, { end_date: null }, { end_date: { $gte: now } }] }
        ];
        filter.$expr = { $lt: ['$used_count', '$usage_limit'] };
    } else if (status === 'expired') {
        filter.end_date = { $lt: now };
    }

    if (store_id) {
        // For seller queries: their store's vouchers + platform-wide vouchers (store_id = null)
        filter.store_id = { $in: [store_id, null] };
    }

    let [items, total] = await Promise.all([
        Voucher.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        Voucher.countDocuments(filter),
    ]);

    // If userId is provided, check claimed status AND filter out already used vouchers
    if (userId && items.length > 0) {
        const [claimed, usedRecords] = await Promise.all([
            UserVoucher.find({
                user_id: userId,
                voucher_id: { $in: items.map(v => v._id) }
            }),
            VoucherUsage.find({
                user_id: userId,
                voucher_id: { $in: items.map(v => v._id) }
            })
        ]);
        const claimedIds = new Set(claimed.map(c => c.voucher_id.toString()));
        const usedIds = new Set(usedRecords.map(u => u.voucher_id.toString()));

        // Filter out vouchers that the user has already used
        items = items
            .filter(v => !usedIds.has(v._id.toString()))
            .map(v => ({
                ...presentVoucher(v),
                isClaimed: claimedIds.has(v._id.toString())
            }));
    } else {
        items = items.map((voucher) => presentVoucher(voucher));
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
const updateVoucher = async (voucherId, data, storeId = null) => {
    const filter = { _id: voucherId };
    const payload = normalizeVoucherPayload(data);
    // If storeId is provided, ensure the voucher belongs to that store (seller scope)
    if (storeId) {
        filter.store_id = storeId;
    }
    const voucher = await Voucher.findOneAndUpdate(filter, payload, { new: true, runValidators: true });
    if (!voucher) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Voucher not found or you do not have permission');
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
    // Get claimed vouchers
    const userVouchers = await UserVoucher.find({ user_id: userId, status: 'claimed' })
        .populate('voucher_id')
        .sort({ claimed_at: -1 });

    const vouchers = userVouchers.map(uv => uv.voucher_id).filter(v => v !== null);

    if (vouchers.length === 0) return [];

    // Filter out vouchers that the user has already used
    const usedRecords = await VoucherUsage.find({
        user_id: userId,
        voucher_id: { $in: vouchers.map(v => v._id) }
    });
    const usedIds = new Set(usedRecords.map(u => u.voucher_id.toString()));

    return vouchers.filter(v => !usedIds.has(v._id.toString()));
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
        if (voucher.max_discount) {
            discount = Math.min(discount, voucher.max_discount);
        }
    } else {
        discount = voucher.discount_value;
    }

    // Discount cannot exceed order amount
    discount = Math.min(discount, orderAmount);

    return {
        voucher: presentVoucher(voucher.toObject()),
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
