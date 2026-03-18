const httpStatus = require('http-status');
const { FlashSale } = require('../models');
const ApiError = require('../utils/ApiError');

const createFlashSale = async (data) => {
    return FlashSale.create(data);
};

const getFlashSales = async (query = {}) => {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
        FlashSale.find(filter)
            .populate('items.productId', 'name media base_price')
            .sort({ starts_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        FlashSale.countDocuments(filter),
    ]);

    return {
        items,
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) },
    };
};

const getFlashSaleById = async (id) => {
    const flashSale = await FlashSale.findById(id).populate('items.productId', 'name media base_price');
    if (!flashSale) throw new ApiError(httpStatus.NOT_FOUND, 'Flash sale not found');
    return flashSale;
};

const updateFlashSale = async (id, data) => {
    const flashSale = await FlashSale.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!flashSale) throw new ApiError(httpStatus.NOT_FOUND, 'Flash sale not found');
    return flashSale;
};

const deleteFlashSale = async (id) => {
    const result = await FlashSale.findByIdAndDelete(id);
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, 'Flash sale not found');
};

const getActiveFlashSales = async () => {
    const now = new Date();
    return FlashSale.find({
        status: 'active',
        starts_at: { $lte: now },
        ends_at: { $gte: now },
    }).populate('items.productId', 'name media base_price');
};

module.exports = { createFlashSale, getFlashSales, getFlashSaleById, updateFlashSale, deleteFlashSale, getActiveFlashSales };
