const express = require('express');
const validate = require('../middleware/validate');
const paymentValidation = require('../validations/payment.validation');
const bankTransferWebhookController = require('../controllers/bankTransferWebhook.controller');
const vnpayController = require('../controllers/vnpay.controller');

const router = express.Router();

router.post('/bank-transfer/callback', validate(paymentValidation.bankTransferCallback), bankTransferWebhookController.callback);
router.get('/bank-transfer/health', bankTransferWebhookController.health);
router.get('/vnpay', validate(paymentValidation.vnpayCallback), vnpayController.ipn);

module.exports = router;
