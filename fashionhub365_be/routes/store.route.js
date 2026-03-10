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

router
    .route('/:storeId')
    .get(validate(storeValidation.getStoreDetail), storeController.getStoreDetail)
    .put(auth.auth(), validate(storeValidation.updateStore), storeController.updateStore);

module.exports = router;
