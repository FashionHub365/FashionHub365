const express = require('express');
const { auth } = require('../middleware/auth');
const flashSaleController = require('../controllers/flashSale.controller');

const router = express.Router();

// Public: active flash sales
router.get('/active', flashSaleController.getActiveFlashSales);

// Admin: CRUD
router.use(auth());
router
    .route('/')
    .get(flashSaleController.getFlashSales)
    .post(flashSaleController.createFlashSale);

router
    .route('/:id')
    .get(flashSaleController.getFlashSaleById)
    .put(flashSaleController.updateFlashSale)
    .delete(flashSaleController.deleteFlashSale);

module.exports = router;
