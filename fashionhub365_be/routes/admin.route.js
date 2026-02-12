const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const adminValidation = require('../validations/admin.validation');
const adminController = require('../controllers/admin.controller');

const router = express.Router();


router.route('/roles')
    .post(auth.auth(), auth.authorize(['ROLE.CREATE']), validate(adminValidation.createRole), adminController.createRole)
    .get(auth.auth(), auth.authorize(['ROLE.VIEW']), adminController.getRoles);


router.route('/permissions')
    .post(auth.auth(), auth.authorize(['PERMISSION.CREATE']), adminController.createPermission)
    .get(auth.auth(), auth.authorize(['PERMISSION.VIEW']), adminController.getPermissions);


router.post('/users/:userId/global-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignGlobalRole),
    adminController.assignGlobalRole
);

router.post('/users/:userId/store-roles',
    auth.auth(),
    auth.authorize(['USER.ASSIGN_ROLE']),
    validate(adminValidation.assignStoreRole),
    adminController.assignStoreRole
);

module.exports = router;
