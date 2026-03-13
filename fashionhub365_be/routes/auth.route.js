const express = require('express');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth');
const { authLimiter, forgotPasswordLimiter, googleAuthLimiter, verificationEmailLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiter applied to sensitive routes
router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/google', googleAuthLimiter, validate(authValidation.googleLogin), authController.googleLogin);
// Gap 1: logout now requires auth
router.post('/logout', auth(), authorize(['AUTH.LOGOUT']), validate(authValidation.logout), authController.logout);
router.post('/refresh', authLimiter, validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/refresh-token', authLimiter, validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/token-valid', validate(authValidation.tokenValid), authController.tokenValid);
router.get('/me', auth(), authorize(['PROFILE.VIEW']), authController.getMe);

// Auth flows
router.post('/change-password', auth(), authorize(['PROFILE.CHANGE_PASSWORD']), validate(authValidation.changePassword), authController.changePassword);
router.post('/forgot-password', forgotPasswordLimiter, validate(authValidation.forgotPassword), authController.forgotPassword);
router.get('/validate-reset-token', validate(authValidation.validateResetToken), authController.validateResetToken);
router.post('/reset-password', authLimiter, validate(authValidation.resetPassword), authController.resetPassword);
router.get('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/resend-verification', verificationEmailLimiter, validate(authValidation.forgotPassword), authController.sendVerificationEmail);
router.post('/send-verification-email', verificationEmailLimiter, validate(authValidation.forgotPassword), authController.sendVerificationEmail);

module.exports = router;
