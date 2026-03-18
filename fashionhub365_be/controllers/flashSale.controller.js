const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const flashSaleService = require('../services/flashSale.service');

const createFlashSale = catchAsync(async (req, res) => {
    const result = await flashSaleService.createFlashSale(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: result });
});

const getFlashSales = catchAsync(async (req, res) => {
    const result = await flashSaleService.getFlashSales(req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getFlashSaleById = catchAsync(async (req, res) => {
    const result = await flashSaleService.getFlashSaleById(req.params.id);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const updateFlashSale = catchAsync(async (req, res) => {
    const result = await flashSaleService.updateFlashSale(req.params.id, req.body);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const deleteFlashSale = catchAsync(async (req, res) => {
    await flashSaleService.deleteFlashSale(req.params.id);
    res.status(httpStatus.OK).send({ success: true, message: 'Flash sale deleted' });
});

const getActiveFlashSales = catchAsync(async (req, res) => {
    const result = await flashSaleService.getActiveFlashSales();
    res.status(httpStatus.OK).send({ success: true, data: result });
});

module.exports = { createFlashSale, getFlashSales, getFlashSaleById, updateFlashSale, deleteFlashSale, getActiveFlashSales };
