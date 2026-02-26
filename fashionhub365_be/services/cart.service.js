const httpStatus = require('http-status');
const { Cart, Product } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get or create cart for a user
 * @param {ObjectId} userId
 * @returns {Promise<Cart>}
 */
const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart.create({ user_id: userId, items: [] });
    }
    return cart;
};

/**
 * Get cart by user id with calculations
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getCartByUserId = async (userId) => {
    const cart = await getOrCreateCart(userId);
    
    // Populate product details for each item
    await cart.populate({
        path: 'items.productId',
        select: 'name media base_price variants'
    });

    let totalAmount = 0;
    let totalItems = 0;

    const items = cart.items.map(item => {
        const product = item.productId;
        if (!product) return null;

        // Find the specific variant to get the correct price and name
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        const price = variant ? (variant.price || product.base_price) : product.base_price;
        const subtotal = price * item.quantity;

        totalAmount += subtotal;
        totalItems += item.quantity;

        return {
            itemId: item._id,
            productId: product._id,
            name: product.name,
            variantName: variant ? variant.variantName : '',
            variantId: item.variantId,
            image: product.media.find(m => m.isPrimary)?.url || (product.media[0]?.url || ''),
            price,
            quantity: item.quantity,
            subtotal,
            inStock: variant ? variant.stock >= item.quantity : false
        };
    }).filter(item => item !== null);

    return {
        id: cart._id,
        items,
        totalItems,
        totalAmount
    };
};

/**
 * Add item to cart
 * @param {ObjectId} userId
 * @param {Object} itemBody
 * @returns {Promise<Cart>}
 */
const addItemToCart = async (userId, itemBody) => {
    const { productId, variantId, quantity } = itemBody;
    
    // 1. Check product and stock
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const variant = product.variants.find(v => v._id.toString() === variantId.toString());
    if (!variant) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product variant not found');
    }

    if (variant.stock < quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Not enough stock. Available: ${variant.stock}`);
    }

    let cart = await getOrCreateCart(userId);

    // 2. Check if item exists (Same Product + Same Variant)
    const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId && item.variantId === variantId
    );

    if (existingItemIndex > -1) {
        // Atomic Check: Total quantity after adding must not exceed stock
        const totalQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (variant.stock < totalQuantity) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Adding ${quantity} more would exceed stock (${variant.stock})`);
        }
        cart.items[existingItemIndex].quantity = totalQuantity;
    } else {
        cart.items.push({
            productId,
            variantId,
            quantity,
            price: variant.price || product.base_price // Store snapshot price if needed, but we calculate fresh in getCart
        });
    }

    await cart.save();
    return cart;
};

/**
 * Update item quantity
 * @param {ObjectId} userId
 * @param {ObjectId} itemId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 */
const updateItemQuantity = async (userId, itemId, quantity) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    const item = cart.items.id(itemId);
    if (!item) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Item not found in cart');
    }

    // Check stock for update
    const product = await Product.findById(item.productId);
    const variant = product?.variants.find(v => v._id.toString() === item.variantId.toString());
    
    if (!variant || variant.stock < quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Cannot update to ${quantity} items. Stock available: ${variant?.stock || 0}`);
    }

    item.quantity = quantity;
    await cart.save();
    return cart;
};

/**
 * Remove item from cart
 * @param {ObjectId} userId
 * @param {ObjectId} itemId
 * @returns {Promise<Cart>}
 */
const removeItemFromCart = async (userId, itemId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    cart.items.pull(itemId);
    await cart.save();
    return cart;
};

/**
 * Clear cart items
 * @param {ObjectId} userId
 * @returns {Promise<Cart>}
 */
const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    cart.items = [];
    await cart.save();
    return cart;
};

module.exports = {
    getOrCreateCart,
    getCartByUserId,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
};
