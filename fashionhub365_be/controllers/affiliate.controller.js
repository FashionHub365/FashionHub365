const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const affiliateService = require('../services/affiliate.service');

// Programs
const createProgram = catchAsync(async (req, res) => {
    const result = await affiliateService.createProgram(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: result });
});

const getPrograms = catchAsync(async (req, res) => {
    const result = await affiliateService.getPrograms(req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const updateProgram = catchAsync(async (req, res) => {
    const result = await affiliateService.updateProgram(req.params.id, req.body);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteProgram = catchAsync(async (req, res) => {
    await affiliateService.deleteProgram(req.params.id);
    res.status(httpStatus.OK).send({ success: true, message: 'Program deleted' });
});

// Links
const generateLink = catchAsync(async (req, res) => {
    const result = await affiliateService.generateLink(req.params.programId, req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getMyLinks = catchAsync(async (req, res) => {
    const result = await affiliateService.getUserLinks(req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

// Commissions
const getMyCommissions = catchAsync(async (req, res) => {
    const result = await affiliateService.getUserCommissions(req.user._id, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { createProgram, getPrograms, updateProgram, deleteProgram, generateLink, getMyLinks, getMyCommissions };
