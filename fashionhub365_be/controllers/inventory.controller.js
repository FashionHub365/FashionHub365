const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const inventoryService = require('../services/inventory.service');

const getInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.getInventoryByStore(req.storeId, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getInventoryById = catchAsync(async (req, res) => {
    const result = await inventoryService.getInventoryById(req.params.id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const upsertInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.upsertInventory(req.body);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const adjustInventory = catchAsync(async (req, res) => {
    const { adjustment } = req.body;
    const result = await inventoryService.adjustInventory(req.params.id, adjustment);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getLowStockAlerts = catchAsync(async (req, res) => {
    const threshold = parseInt(req.query.threshold) || 10;
    const result = await inventoryService.getLowStockAlerts(req.storeId, threshold);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { getInventory, getInventoryById, upsertInventory, adjustInventory, getLowStockAlerts };
