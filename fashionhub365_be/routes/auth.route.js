const express = require('express');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiter applied to sensitive routes
router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
// Gap 1: logout now requires auth
router.post('/logout', auth(), validate(authValidation.logout), authController.logout);
router.post('/refresh-token', authLimiter, validate(authValidation.refreshTokens), authController.refreshTokens);
router.get('/me', auth(), authController.getMe);

// Auth flows
router.post('/change-password', auth(), validate(authValidation.changePassword), authController.changePassword);
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(authValidation.resetPassword), authController.resetPassword);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);

module.exports = router;
