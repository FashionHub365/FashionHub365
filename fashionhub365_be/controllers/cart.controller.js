const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { cartService } = require('../services');

const getCart = catchAsync(async (req, res) => {
    const result = await cartService.getCartByUserId(req.user._id);
    res.send({
        success: true,
        data: result
    });
});

const addItem = catchAsync(async (req, res) => {
    await cartService.addItemToCart(req.user._id, req.body);
    const result = await cartService.getCartByUserId(req.user._id);
    res.status(httpStatus.CREATED).send({
        success: true,
        data: result
    });
});

const updateItem = catchAsync(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    await cartService.updateItemQuantity(req.user._id, itemId, quantity);
    const result = await cartService.getCartByUserId(req.user._id);
    res.send({
        success: true,
        data: result
    });
});

const removeItem = catchAsync(async (req, res) => {
    const { itemId } = req.params;
    await cartService.removeItemFromCart(req.user._id, itemId);
    const result = await cartService.getCartByUserId(req.user._id);
    res.send({
        success: true,
        data: result
    });
});

const clearCart = catchAsync(async (req, res) => {
    await cartService.clearCart(req.user._id);
    res.send({
        success: true,
        data: {
            items: [],
            totalItems: 0,
            totalAmount: 0
        }
    });
});

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
};
