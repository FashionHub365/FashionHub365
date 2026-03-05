const express = require('express');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const cartValidation = require('../validations/cart.validation');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

// All cart routes require authentication
router.use(auth());

router
    .route('/')
    .get(cartController.getCart)
    .delete(cartController.clearCart);

router
    .route('/items')
    .post(validate(cartValidation.addToCart), cartController.addItem);

router
    .route('/items/:itemId')
    .patch(validate(cartValidation.updateCartItem), cartController.updateItem)
    .delete(validate(cartValidation.removeCartItem), cartController.removeItem);

module.exports = router;
