const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { collectionService } = require('../services');

const createCollection = catchAsync(async (req, res) => {
    const collection = await collectionService.createCollection(req.body);
    res.status(httpStatus.CREATED).send(collection);
});

const getCollections = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }
    const result = await collectionService.queryCollections(filter);
    res.send(result);
});

const getCollection = catchAsync(async (req, res) => {
    const collection = await collectionService.getCollectionById(req.params.collectionId);
    if (!collection) {
        res.status(httpStatus.NOT_FOUND).send({ message: 'Collection not found' });
        return;
    }
    res.send(collection);
});

const updateCollection = catchAsync(async (req, res) => {
    const collection = await collectionService.updateCollectionById(req.params.collectionId, req.body);
    res.send(collection);
});

const deleteCollection = catchAsync(async (req, res) => {
    await collectionService.deleteCollectionById(req.params.collectionId);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createCollection,
    getCollections,
    getCollection,
    updateCollection,
    deleteCollection,
};
