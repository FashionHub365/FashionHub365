const express = require('express');
const validate = require('../middleware/validate');
const paymentValidation = require('../validations/payment.validation');
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/create', auth(), validate(paymentValidation.createPayment), paymentController.createPayment);
router.get('/:paymentUuid/status', auth(), validate(paymentValidation.getPaymentStatus), paymentController.getPaymentStatus);
router.get('/:paymentUuid/detail', auth(), validate(paymentValidation.getPaymentDetail), paymentController.getPaymentDetail);
router.get('/transaction/:transactionId', auth(), validate(paymentValidation.getPaymentByTransactionId), paymentController.getPaymentByTransactionId);
router.post('/:transactionId/cancel', auth(), validate(paymentValidation.cancelPayment), paymentController.cancelPayment);

module.exports = router;
