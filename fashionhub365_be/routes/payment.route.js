const express = require('express');
const validate = require('../middleware/validate');
const paymentValidation = require('../validations/payment.validation');
const paymentController = require('../controllers/payment.controller');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/create', auth(), authorize(['PAYMENT.CREATE']), validate(paymentValidation.createPayment), paymentController.createPayment);
router.get('/:paymentUuid/status', auth(), authorize(['PAYMENT.VIEW_OWN']), validate(paymentValidation.getPaymentStatus), paymentController.getPaymentStatus);
router.get('/:paymentUuid/detail', auth(), authorize(['PAYMENT.VIEW_OWN']), validate(paymentValidation.getPaymentDetail), paymentController.getPaymentDetail);
router.get('/transaction/:transactionId', auth(), authorize(['PAYMENT.VIEW_OWN']), validate(paymentValidation.getPaymentByTransactionId), paymentController.getPaymentByTransactionId);
router.post('/:transactionId/cancel', auth(), authorize(['PAYMENT.CANCEL_OWN']), validate(paymentValidation.cancelPayment), paymentController.cancelPayment);

module.exports = router;
