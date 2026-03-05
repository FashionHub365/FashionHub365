const express = require('express');
const paymentMethodController = require('../controllers/paymentMethod.controller');

const router = express.Router();

router.get('/enabled', paymentMethodController.getEnabledPaymentMethods);
router.get('/', paymentMethodController.getPaymentMethods);
router.get('/:code', paymentMethodController.getPaymentMethod);

module.exports = router;
