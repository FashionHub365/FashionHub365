const express = require('express');
const { auth } = require('../middleware/auth');
const referralController = require('../controllers/referral.controller');

const router = express.Router();

router.use(auth());

router.get('/code', referralController.generateCode);
router.post('/apply', referralController.applyReferral);
router.get('/stats', referralController.getStats);
router.get('/history', referralController.getHistory);

module.exports = router;
