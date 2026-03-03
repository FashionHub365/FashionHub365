const Wishlist = require('../models/Wishlist');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const getWishlist = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let wishlist = await Wishlist.findOne({ user_id: req.user._id }).populate({
        path: 'items.productId',
        select: 'name base_price media description'
    });

    if (!wishlist) {
        wishlist = await Wishlist.create({ user_id: req.user._id, items: [] });
    }

    const totalItems = wishlist.items.length;
    const paginatedItems = wishlist.items
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)) // Sort by newest
        .slice(skip, skip + limit);

    res.status(httpStatus.OK).send({
        success: true,
        data: {
            items: paginatedItems,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                limit
            }
        }
    });
});

const addToWishlist = catchAsync(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required');
    }

    let wishlist = await Wishlist.findOne({ user_id: req.user._id });

    if (!wishlist) {
        wishlist = await Wishlist.create({ user_id: req.user._id, items: [{ productId }] });
    } else {
        // Check if item already exists
        const itemExists = wishlist.items.some(item => item.productId.toString() === productId);
        if (!itemExists) {
            wishlist.items.push({ productId });
            await wishlist.save();
        }
    }

    res.status(httpStatus.OK).send({
        success: true,
        message: 'Product added to wishlist',
        data: wishlist
    });
});

const removeFromWishlist = catchAsync(async (req, res) => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user_id: req.user._id });

    if (wishlist) {
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
    }

    res.status(httpStatus.OK).send({
        success: true,
        message: 'Product removed from wishlist',
        data: wishlist
    });
});

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
