const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tagService } = require('../services');

const createTag = catchAsync(async (req, res) => {
    const tag = await tagService.createTag(req.body);
    res.status(httpStatus.CREATED).send(tag);
});

const getTags = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }
    const result = await tagService.queryTags(filter);
    res.send(result);
});

const deleteTag = catchAsync(async (req, res) => {
    await tagService.deleteTagById(req.params.tagId);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createTag,
    getTags,
    deleteTag,
};
