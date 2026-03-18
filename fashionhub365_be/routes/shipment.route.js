const express = require('express');
const { auth } = require('../middleware/auth');
const shipmentController = require('../controllers/shipment.controller');

const router = express.Router();

router.use(auth());

// Public/Customer tracking
router.get('/tracking/:orderId', shipmentController.getOrderTracking);

// Seller routes
router.post('/', shipmentController.createShipment);
router.post('/:shipmentId/events', shipmentController.addEvent);
router.get('/providers', shipmentController.getProviders);

module.exports = router;
