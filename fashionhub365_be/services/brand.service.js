const httpStatus = require('http-status');
const { Brand } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a brand
 * @param {Object} brandBody
 * @returns {Promise<Brand>}
 */
const createBrand = async (brandBody) => {
    return Brand.create(brandBody);
};

/**
 * Query for brands
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryBrands = async (filter, options) => {
    const brands = await Brand.find(filter).sort({ name: 1 });
    return brands;
};

/**
 * Get brand by id
 * @param {ObjectId} id
 * @returns {Promise<Brand>}
 */
const getBrandById = async (id) => {
    return Brand.findById(id);
};

/**
 * Update brand by id
 * @param {ObjectId} brandId
 * @param {Object} updateBody
 * @returns {Promise<Brand>}
 */
const updateBrandById = async (brandId, updateBody) => {
    const brand = await getBrandById(brandId);
    if (!brand) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
    }
    Object.assign(brand, updateBody);
    await brand.save();
    return brand;
};

/**
 * Delete brand by id
 * @param {ObjectId} brandId
 * @returns {Promise<Brand>}
 */
const deleteBrandById = async (brandId) => {
    const brand = await getBrandById(brandId);
    if (!brand) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
    }
    await brand.deleteOne();
    return brand;
};

module.exports = {
    createBrand,
    queryBrands,
    getBrandById,
    updateBrandById,
    deleteBrandById,
};
