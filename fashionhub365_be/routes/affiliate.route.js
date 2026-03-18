const express = require('express');
const { auth } = require('../middleware/auth');
const affiliateController = require('../controllers/affiliate.controller');

const router = express.Router();

// Public: get programs
router.get('/programs', affiliateController.getPrograms);

// Authenticated routes
router.use(auth());

// Programs (admin)
router.post('/programs', affiliateController.createProgram);
router.put('/programs/:id', affiliateController.updateProgram);
router.delete('/programs/:id', affiliateController.deleteProgram);

// Links (user)
router.post('/links/:programId', affiliateController.generateLink);
router.get('/links/my', affiliateController.getMyLinks);

// Commissions (user)
router.get('/commissions/my', affiliateController.getMyCommissions);

module.exports = router;
