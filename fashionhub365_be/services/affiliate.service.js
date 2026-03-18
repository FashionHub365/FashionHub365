const httpStatus = require('http-status');
const { AffiliateProgram, AffiliateLink, AffiliateCommission } = require('../models');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

// ---- Programs ----
const createProgram = async (data) => {
    return AffiliateProgram.create(data);
};

const getPrograms = async (query = {}) => {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
        AffiliateProgram.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
        AffiliateProgram.countDocuments(filter),
    ]);
    return { items, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) } };
};

const updateProgram = async (id, data) => {
    const program = await AffiliateProgram.findByIdAndUpdate(id, data, { new: true });
    if (!program) throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
    return program;
};

const deleteProgram = async (id) => {
    const result = await AffiliateProgram.findByIdAndDelete(id);
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
};

// ---- Links ----
const generateLink = async (programId, userId) => {
    const program = await AffiliateProgram.findById(programId);
    if (!program || program.status !== 'active') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Program is not active');
    }

    const existing = await AffiliateLink.findOne({ program_id: programId, user_id: userId });
    if (existing) return existing;

    const code = `AFF-${uuidv4().slice(0, 8).toUpperCase()}`;
    return AffiliateLink.create({ program_id: programId, user_id: userId, code });
};

const getUserLinks = async (userId) => {
    return AffiliateLink.find({ user_id: userId }).populate('program_id', 'name commission_type commission_value');
};

// ---- Commissions ----
const recordCommission = async (linkId, orderId, amount) => {
    return AffiliateCommission.create({ link_id: linkId, order_id: orderId, amount, status: 'pending' });
};

const getUserCommissions = async (userId, query = {}) => {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const links = await AffiliateLink.find({ user_id: userId }).select('_id');
    const linkIds = links.map(l => l._id);
    const filter = { link_id: { $in: linkIds } };

    const [items, total] = await Promise.all([
        AffiliateCommission.find(filter)
            .populate('order_id', 'total_amount status')
            .sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
        AffiliateCommission.countDocuments(filter),
    ]);
    return { items, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) } };
};

module.exports = {
    createProgram, getPrograms, updateProgram, deleteProgram,
    generateLink, getUserLinks,
    recordCommission, getUserCommissions,
};
