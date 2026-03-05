const express = require('express');
const { auth } = require('../middleware/auth');
const wishlistController = require('../controllers/wishlist.controller');

const router = express.Router();

// All wishlist routes require authentication
router.use(auth());

router
    .route('/')
    .get(wishlistController.getWishlist)
    .post(wishlistController.addToWishlist);

router
    .route('/:productId')
    .delete(wishlistController.removeFromWishlist);

module.exports = router;
