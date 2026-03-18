const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const campaignService = require('../services/campaign.service');

const createCampaign = catchAsync(async (req, res) => {
    const result = await campaignService.createCampaign(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: result });
});

const getCampaigns = catchAsync(async (req, res) => {
    const result = await campaignService.getCampaigns(req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getCampaignById = catchAsync(async (req, res) => {
    const result = await campaignService.getCampaignById(req.params.id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const updateCampaign = catchAsync(async (req, res) => {
    const result = await campaignService.updateCampaign(req.params.id, req.body);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteCampaign = catchAsync(async (req, res) => {
    await campaignService.deleteCampaign(req.params.id);
    res.status(httpStatus.OK).send({ success: true, message: 'Campaign deleted' });
});

const getActiveCampaigns = catchAsync(async (req, res) => {
    const result = await campaignService.getActiveCampaigns();
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { createCampaign, getCampaigns, getCampaignById, updateCampaign, deleteCampaign, getActiveCampaigns };
