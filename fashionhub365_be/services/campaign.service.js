const httpStatus = require('http-status');
const { Campaign } = require('../models');
const ApiError = require('../utils/ApiError');

const createCampaign = async (data) => {
    return Campaign.create(data);
};

const getCampaigns = async (query = {}) => {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
        Campaign.find(filter)
            .populate('products.productId', 'name media base_price')
            .sort({ starts_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Campaign.countDocuments(filter),
    ]);

    return {
        items,
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) },
    };
};

const getCampaignById = async (id) => {
    const campaign = await Campaign.findById(id).populate('products.productId', 'name media base_price');
    if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
    return campaign;
};

const updateCampaign = async (id, data) => {
    const campaign = await Campaign.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
    return campaign;
};

const deleteCampaign = async (id) => {
    const result = await Campaign.findByIdAndDelete(id);
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
};

const getActiveCampaigns = async () => {
    const now = new Date();
    return Campaign.find({
        status: 'active',
        starts_at: { $lte: now },
        ends_at: { $gte: now },
    }).populate('products.productId', 'name media base_price');
};

module.exports = { createCampaign, getCampaigns, getCampaignById, updateCampaign, deleteCampaign, getActiveCampaigns };
