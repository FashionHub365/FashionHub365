const httpStatus = require('http-status');
const { Collection } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a collection
 * @param {Object} collectionBody
 * @returns {Promise<Collection>}
 */
const createCollection = async (collectionBody) => {
    return Collection.create(collectionBody);
};

/**
 * Query for collections
 * @param {Object} filter - Mongo filter
 * @returns {Promise<Array>}
 */
const queryCollections = async (filter) => {
    const collections = await Collection.find(filter).sort({ name: 1 });
    return collections;
};

/**
 * Get collection by id
 * @param {ObjectId} id
 * @returns {Promise<Collection>}
 */
const getCollectionById = async (id) => {
    return Collection.findById(id);
};

/**
 * Update collection by id
 * @param {ObjectId} collectionId
 * @param {Object} updateBody
 * @returns {Promise<Collection>}
 */
const updateCollectionById = async (collectionId, updateBody) => {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Collection not found');
    }
    Object.assign(collection, updateBody);
    await collection.save();
    return collection;
};

/**
 * Delete collection by id
 * @param {ObjectId} collectionId
 * @returns {Promise<Collection>}
 */
const deleteCollectionById = async (collectionId) => {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Collection not found');
    }
    await collection.deleteOne();
    return collection;
};

module.exports = {
    createCollection,
    queryCollections,
    getCollectionById,
    updateCollectionById,
    deleteCollectionById,
};
