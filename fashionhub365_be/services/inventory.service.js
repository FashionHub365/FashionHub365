const httpStatus = require('http-status');
const { Inventory, Product } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get inventory list for a store's products
 */
const getInventoryByStore = async (storeId, query = {}) => {
    const { page = 1, limit = 20, productId, location } = query;
    const skip = (page - 1) * limit;

    const filter = {};

    // Get products belonging to this store
    const storeProducts = await Product.find({ store_id: storeId }).select('_id name media base_price variants');
    const productIds = storeProducts.map(p => p._id);

    await Promise.all(
        storeProducts.flatMap((product) => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            if (variants.length === 0) {
                return [
                    Inventory.findOneAndUpdate(
                        { product_id: product._id, variant_id: null, location: 'default' },
                        {
                            $set: {
                                quantity: 0,
                                updated_at: new Date(),
                            },
                        },
                        { upsert: true, new: true }
                    )
                ];
            }

            return variants.map((variant) => Inventory.findOneAndUpdate(
                { product_id: product._id, variant_id: variant._id.toString(), location: 'default' },
                {
                    $set: {
                        quantity: Number(variant.stock) || 0,
                        updated_at: new Date(),
                    },
                },
                { upsert: true, new: true }
            ));
        })
    );

    filter.product_id = { $in: productIds };

    if (productId) filter.product_id = productId;
    if (location) filter.location = location;

    const [items, total] = await Promise.all([
        Inventory.find(filter)
            .populate('product_id', 'name media base_price variants')
            .sort({ updated_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Inventory.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

/**
 * Get single inventory record
 */
const getInventoryById = async (inventoryId) => {
    const inventory = await Inventory.findById(inventoryId).populate('product_id', 'name media base_price variants');
    if (!inventory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Inventory record not found');
    }
    return inventory;
};

/**
 * Create or update inventory (upsert by product + variant + location)
 */
const upsertInventory = async (data) => {
    const { product_id, variant_id, location, quantity } = data;

    const inventory = await Inventory.findOneAndUpdate(
        { product_id, variant_id: variant_id || null, location: location || 'default' },
        {
            $set: {
                quantity,
                updated_at: new Date(),
            },
        },
        { upsert: true, new: true }
    );

    return inventory;
};

/**
 * Adjust inventory quantity (increment/decrement)
 */
const adjustInventory = async (inventoryId, adjustment) => {
    const inventory = await Inventory.findById(inventoryId).populate('product_id', 'variants');
    if (!inventory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Inventory record not found');
    }

    const variant = inventory.variant_id
        ? inventory.product_id?.variants?.find((item) => item._id.toString() === String(inventory.variant_id))
        : null;

    const currentQty = variant ? Number(variant.stock) || 0 : Number(inventory.quantity) || 0;
    const newQty = currentQty + adjustment;
    if (newQty < 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient inventory');
    }

    inventory.quantity = newQty;
    inventory.updated_at = new Date();

    if (variant) {
        variant.stock = newQty;
        await inventory.product_id.save();
    }

    await inventory.save();
    return inventory;
};

/**
 * Get low-stock alerts
 */
const getLowStockAlerts = async (storeId, threshold = 10) => {
    const storeProducts = await Product.find({ store_id: storeId }).select('_id');
    const productIds = storeProducts.map(p => p._id);

    return Inventory.find({
        product_id: { $in: productIds },
        quantity: { $lte: threshold },
    })
        .populate('product_id', 'name media base_price')
        .sort({ quantity: 1 });
};

module.exports = {
    getInventoryByStore,
    getInventoryById,
    upsertInventory,
    adjustInventory,
    getLowStockAlerts,
};
