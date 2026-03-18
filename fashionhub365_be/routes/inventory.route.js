const express = require('express');
const { auth } = require('../middleware/auth');
const { storeAuth } = require('../middleware/storeAuth');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// All inventory routes require auth + store context
router.use(auth());

router
    .route('/')
    .get(storeAuth(), inventoryController.getInventory)
    .post(storeAuth(), inventoryController.upsertInventory);

router
    .route('/low-stock')
    .get(storeAuth(), inventoryController.getLowStockAlerts);

router
    .route('/:id')
    .get(inventoryController.getInventoryById)
    .patch(storeAuth(), inventoryController.adjustInventory);

module.exports = router;
