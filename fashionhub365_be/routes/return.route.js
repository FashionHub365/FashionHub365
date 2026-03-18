const express = require('express');
const { auth } = require('../middleware/auth');
const returnController = require('../controllers/return.controller');

const router = express.Router();

// All return routes require authentication
router.use(auth());

// Customer routes
router.post('/request', returnController.requestReturn);
router.get('/my-returns', returnController.getMyReturns);

// Seller/Admin routes
router.get('/store/:storeId', returnController.getStoreReturns);
router.patch('/:returnId/process', returnController.processReturn);

module.exports = router;
