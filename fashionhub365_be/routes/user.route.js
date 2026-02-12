const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const userValidation = require('../validations/user.validation');
const userController = require('../controllers/user.controller');

const router = express.Router();

router
    .route('/')
    .post(auth.auth(), auth.authorize(['USER.CREATE']), validate(userValidation.createUser), userController.createUser)
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(userValidation.getUsers), userController.getUsers);

router
    .route('/:userId')
    .get(auth.auth(), auth.authorize(['USER.VIEW']), validate(userValidation.getUser), userController.getUser)
    .patch(auth.auth(), auth.authorize(['USER.UPDATE']), validate(userValidation.updateUser), userController.updateUser)
    .delete(auth.auth(), auth.authorize(['USER.DELETE']), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
