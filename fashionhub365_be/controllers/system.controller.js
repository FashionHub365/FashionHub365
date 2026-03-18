const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const systemService = require('../services/system.service');

// Settings
const getSettings = catchAsync(async (req, res) => {
    const result = await systemService.getAllSettings();
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const upsertSetting = catchAsync(async (req, res) => {
    const { key, value, scope } = req.body;
    const result = await systemService.upsertSetting(key, value, scope);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteSetting = catchAsync(async (req, res) => {
    await systemService.deleteSetting(req.params.key);
    res.status(httpStatus.OK).send({ success: true, message: 'Setting deleted' });
});

// Feature Flags
const getFlags = catchAsync(async (req, res) => {
    const result = await systemService.getAllFlags();
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const upsertFlag = catchAsync(async (req, res) => {
    const { key, enabled, description } = req.body;
    const result = await systemService.upsertFlag(key, enabled, description);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteFlag = catchAsync(async (req, res) => {
    await systemService.deleteFlag(req.params.key);
    res.status(httpStatus.OK).send({ success: true, message: 'Feature flag deleted' });
});

// Activity Logs
const getActivityLogs = catchAsync(async (req, res) => {
    const result = await systemService.getActivityLogs(req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { getSettings, upsertSetting, deleteSetting, getFlags, upsertFlag, deleteFlag, getActivityLogs };
