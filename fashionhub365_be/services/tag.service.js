const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
    if (await Tag.findOne({ name: tagBody.name })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Tag already exists');
    }
    return Tag.create(tagBody);
};

/**
 * Query for tags
 * @param {Object} filter - Mongo filter
 * @returns {Promise<Array>}
 */
const queryTags = async (filter) => {
    const tags = await Tag.find(filter).sort({ name: 1 });
    return tags;
};

/**
 * Get tag by id
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const getTagById = async (id) => {
    return Tag.findById(id);
};

/**
 * Delete tag by id
 * @param {ObjectId} tagId
 * @returns {Promise<Tag>}
 */
const deleteTagById = async (tagId) => {
    const tag = await getTagById(tagId);
    if (!tag) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
    }
    await tag.deleteOne();
    return tag;
};

module.exports = {
    createTag,
    queryTags,
    getTagById,
    deleteTagById,
};
