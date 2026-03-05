const express = require('express');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminAuthValidation = require('../validations/adminAuth.validation');
const adminAuthController = require('../controllers/adminAuth.controller');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, validate(adminAuthValidation.login), adminAuthController.login);
router.post('/refresh-token', authLimiter, validate(adminAuthValidation.refreshToken), adminAuthController.refreshToken);
router.post('/logout', auth.auth(), validate(adminAuthValidation.logout), adminAuthController.logout);

module.exports = router;
