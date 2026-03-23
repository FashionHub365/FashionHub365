const express = require('express');
const validate = require('../middleware/validate');
const affiliateValidation = require('../validations/affiliate.validation');
const { auth } = require('../middleware/auth');
const affiliateController = require('../controllers/affiliate.controller');

const router = express.Router();

// Public: get programs
router.get('/programs', affiliateController.getPrograms);

// Authenticated routes
router.use(auth());

// Programs (admin)
router.post('/programs', validate(affiliateValidation.createProgram), affiliateController.createProgram);
router.put('/programs/:id', validate(affiliateValidation.createProgram), affiliateController.updateProgram);
router.delete('/programs/:id', affiliateController.deleteProgram);

// Links (user)
router.post('/links/:programId', affiliateController.generateLink);
router.get('/links/my', affiliateController.getMyLinks);

// Commissions (user)
router.get('/commissions/my', affiliateController.getMyCommissions);

module.exports = router;
