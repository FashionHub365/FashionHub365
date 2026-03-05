const express = require('express');
const validate = require('../middleware/validate');
const paymentValidation = require('../validations/payment.validation');
const vnpayController = require('../controllers/vnpay.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/create', auth(), validate(paymentValidation.createVNPayPayment), vnpayController.createVNPayPayment);
router.get('/callback', validate(paymentValidation.vnpayCallback), vnpayController.callback);
router.get('/query/:transactionId', auth(), validate(paymentValidation.getPaymentByTransactionId), vnpayController.queryPayment);

module.exports = router;
