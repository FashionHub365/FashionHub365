const express = require('express');
const storeController = require('../controllers/store.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:storeId/follower-count', storeController.getStoreFollowerCount);

// Protected routes
router.get('/following', auth.auth(), storeController.getFollowingStores);
router.post('/:storeId/follow', auth.auth(), storeController.followStore);
router.post('/:storeId/unfollow', auth.auth(), storeController.unfollowStore);
router.get('/:storeId/following-status', auth.auth(), storeController.getFollowingStatus);

module.exports = router;

