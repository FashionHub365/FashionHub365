const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const wishlistController = require('../controllers/wishlist.controller');

const router = express.Router();

// All wishlist routes require authentication
router.use(auth(), authorize(['WISHLIST.MANAGE']));

router
    .route('/')
    .get(wishlistController.getWishlist)
    .post(wishlistController.addToWishlist);

router
    .route('/:productId')
    .delete(wishlistController.removeFromWishlist);

module.exports = router;
