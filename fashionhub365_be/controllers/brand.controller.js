const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { brandService } = require('../services');

const createBrand = catchAsync(async (req, res) => {
    const brand = await brandService.createBrand(req.body);
    res.status(httpStatus.CREATED).send(brand);
});

const getBrands = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }
    const result = await brandService.queryBrands(filter);
    res.send(result);
});

const getBrand = catchAsync(async (req, res) => {
    const brand = await brandService.getBrandById(req.params.brandId);
    if (!brand) {
        res.status(httpStatus.NOT_FOUND).send({ message: 'Brand not found' });
        return;
    }
    res.send(brand);
});

const updateBrand = catchAsync(async (req, res) => {
    const brand = await brandService.updateBrandById(req.params.brandId, req.body);
    res.send(brand);
});

const deleteBrand = catchAsync(async (req, res) => {
    await brandService.deleteBrandById(req.params.brandId);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createBrand,
    getBrands,
    getBrand,
    updateBrand,
    deleteBrand,
};
