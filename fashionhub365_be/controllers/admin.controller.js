const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { Role, Permission } = require('../models');
const { userService } = require('../services');
const ApiError = require('../utils/ApiError');

// M1: Consistent response format
const createRole = catchAsync(async (req, res) => {
    if (await Role.findOne({ slug: req.body.slug })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role already exists');
    }
    const role = await Role.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { role } });
});

const getRoles = catchAsync(async (req, res) => {
    const roles = await Role.find().populate('permission_ids');
    res.send({ success: true, data: { roles } });
});

const createPermission = catchAsync(async (req, res) => {
    if (await Permission.findOne({ code: req.body.code })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Permission already exists');
    }
    const permission = await Permission.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { permission } });
});

const getPermissions = catchAsync(async (req, res) => {
    const permissions = await Permission.find();
    res.send({ success: true, data: { permissions } });
});

const assignGlobalRole = catchAsync(async (req, res) => {
    const user = await userService.assignGlobalRole(req.params.userId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { user } });
});

const assignStoreRole = catchAsync(async (req, res) => {
    const member = await userService.assignStoreRole(req.params.userId, req.body.storeId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { member } });
});

module.exports = {
    createRole,
    getRoles,
    createPermission,
    getPermissions,
    assignGlobalRole,
    assignStoreRole,
};
