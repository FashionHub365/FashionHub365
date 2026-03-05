const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const userAddressValidation = require('../validations/userAddress.validation');
const userAddressController = require('../controllers/userAddress.controller');

const router = express.Router();

router.route('/')
    .post(auth.auth(), validate(userAddressValidation.createAddress), userAddressController.createAddress)
    .get(auth.auth(), userAddressController.listAddresses);

router.route('/:uuid')
    .get(auth.auth(), validate(userAddressValidation.addressParams), userAddressController.getAddress)
    .put(auth.auth(), validate(userAddressValidation.updateAddress), userAddressController.updateAddress)
    .delete(auth.auth(), validate(userAddressValidation.addressParams), userAddressController.deleteAddress);

router.put('/:uuid/default', auth.auth(), validate(userAddressValidation.addressParams), userAddressController.setDefaultAddress);

module.exports = router;
