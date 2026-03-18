const httpStatus = require('http-status');
const { Referral } = require('../models');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a referral code for a user
 */
const generateReferralCode = async (userId) => {
    const existing = await Referral.findOne({ referrer_id: userId, referee_id: { $exists: false } });
    if (existing) return existing;

    const code = `REF-${uuidv4().slice(0, 8).toUpperCase()}`;
    return Referral.create({ referrer_id: userId, referee_id: userId, code, status: 'active' });
};

/**
 * Apply referral (when a new user registers with a referral code)
 */
const applyReferral = async (code, newUserId) => {
    const referral = await Referral.findOne({ code, status: 'active' });
    if (!referral) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid referral code');
    }

    if (referral.referrer_id.toString() === newUserId.toString()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot refer yourself');
    }

    // Create usage record
    return Referral.create({
        referrer_id: referral.referrer_id,
        referee_id: newUserId,
        code,
        status: 'completed',
    });
};

/**
 * Get referral stats for a user
 */
const getReferralStats = async (userId) => {
    const referral = await Referral.findOne({ referrer_id: userId, referee_id: userId });
    const totalReferred = await Referral.countDocuments({
        referrer_id: userId,
        status: 'completed',
        referee_id: { $ne: userId },
    });

    return {
        code: referral?.code || null,
        totalReferred,
    };
};

/**
 * Get referral history
 */
const getReferralHistory = async (userId, query = {}) => {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter = { referrer_id: userId, referee_id: { $ne: userId } };

    const [items, total] = await Promise.all([
        Referral.find(filter)
            .populate('referee_id', 'display_name email')
            .sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
        Referral.countDocuments(filter),
    ]);

    return {
        items,
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) },
    };
};

module.exports = { generateReferralCode, applyReferral, getReferralStats, getReferralHistory };
