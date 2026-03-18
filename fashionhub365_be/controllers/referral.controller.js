const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const referralService = require('../services/referral.service');

const generateCode = catchAsync(async (req, res) => {
    const result = await referralService.generateReferralCode(req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const applyReferral = catchAsync(async (req, res) => {
    const { code } = req.body;
    const result = await referralService.applyReferral(code, req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getStats = catchAsync(async (req, res) => {
    const result = await referralService.getReferralStats(req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getHistory = catchAsync(async (req, res) => {
    const result = await referralService.getReferralHistory(req.user._id, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { generateCode, applyReferral, getStats, getHistory };
