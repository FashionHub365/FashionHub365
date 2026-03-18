const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const storeValidation = require('../validations/store.validation');
const storeController = require('../controllers/store.controller');

const router = express.Router();

router
    .route('/')
    .get(validate(storeValidation.listStores), storeController.listStores)
    .post(auth.auth(), validate(storeValidation.createStore), storeController.createStore);

router.get('/me', auth.auth(), storeController.getMyStore);

// Protected routes
router.get('/following', auth.auth(), storeController.getFollowingStores);

router
    .route('/:storeId')
    .get(validate(storeValidation.getStoreDetail), storeController.getStoreDetail)
    .put(auth.auth(), auth.authorize(['STORE.UPDATE']), validate(storeValidation.updateStore), storeController.updateStore);

// Public routes
router.get('/:storeId/follower-count', storeController.getStoreFollowerCount);

// Protected routes
router.get('/following', auth.auth(), auth.authorize(['STORE.FOLLOW']), storeController.getFollowingStores);
router.post('/:storeId/follow', auth.auth(), auth.authorize(['STORE.FOLLOW']), storeController.followStore);
router.post('/:storeId/unfollow', auth.auth(), auth.authorize(['STORE.FOLLOW']), storeController.unfollowStore);
router.get('/:storeId/following-status', auth.auth(), auth.authorize(['STORE.FOLLOW']), storeController.getFollowingStatus);

module.exports = router;

