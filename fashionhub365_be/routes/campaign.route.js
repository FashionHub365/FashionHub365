const express = require('express');
const { auth } = require('../middleware/auth');
const campaignController = require('../controllers/campaign.controller');

const router = express.Router();

// Public: active campaigns
router.get('/active', campaignController.getActiveCampaigns);

// Admin: CRUD
router.use(auth());
router
    .route('/')
    .get(campaignController.getCampaigns)
    .post(campaignController.createCampaign);

router
    .route('/:id')
    .get(campaignController.getCampaignById)
    .put(campaignController.updateCampaign)
    .delete(campaignController.deleteCampaign);

module.exports = router;
