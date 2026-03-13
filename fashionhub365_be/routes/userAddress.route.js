const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const userAddressValidation = require('../validations/userAddress.validation');
const userAddressController = require('../controllers/userAddress.controller');

const router = express.Router();

router.route('/')
    .post(auth.auth(), auth.authorize(['ADDRESS.MANAGE']), validate(userAddressValidation.createAddress), userAddressController.createAddress)
    .get(auth.auth(), auth.authorize(['ADDRESS.MANAGE']), userAddressController.listAddresses);

router.route('/:uuid')
    .get(auth.auth(), auth.authorize(['ADDRESS.MANAGE']), validate(userAddressValidation.addressParams), userAddressController.getAddress)
    .put(auth.auth(), auth.authorize(['ADDRESS.MANAGE']), validate(userAddressValidation.updateAddress), userAddressController.updateAddress)
    .delete(auth.auth(), auth.authorize(['ADDRESS.MANAGE']), validate(userAddressValidation.addressParams), userAddressController.deleteAddress);

router.put('/:uuid/default', auth.auth(), auth.authorize(['ADDRESS.MANAGE']), validate(userAddressValidation.addressParams), userAddressController.setDefaultAddress);

module.exports = router;
