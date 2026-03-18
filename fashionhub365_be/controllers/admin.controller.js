const adminUserController = require('./adminUser.controller');
const adminRoleController = require('./adminRole.controller');
const adminSystemController = require('./adminSystem.controller');
const adminStoreController = require('./adminStore.controller');

module.exports = {
    ...adminUserController,
    ...adminRoleController,
    ...adminSystemController,
    ...adminStoreController,
};
