const httpStatus = require('http-status');
const mongoose = require('mongoose');
const config = require('../config/config');
const { Cart, Order, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const { runWithTransaction } = require('../utils/transaction');
const stockReservationService = require('./stockReservation.service');

const SUPPORTED_PAYMENT_METHODS = ['cod', 'bank_transfer', 'vnpay'];

const normalizePaymentMethod = (paymentMethod = 'cod') => {
    const normalized = `${paymentMethod || ''}`.trim().toLowerCase();
    return normalized || 'cod';
};

const ensureSupportedPaymentMethod = (paymentMethod) => {
    if (!SUPPORTED_PAYMENT_METHODS.includes(paymentMethod)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Unsupported payment method: ${paymentMethod}`);
    }
};

const isOnlinePaymentMethod = (paymentMethod) => {
    const normalized = normalizePaymentMethod(paymentMethod);
    return normalized !== 'cod';
};

const toObjectId = (value) => {
    if (value instanceof mongoose.Types.ObjectId) {
        return value;
    }
    if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return value;
};

const reserveOrDeductStock = async (cartItems, options = {}) => {
    const { session } = options;
    for (const cartItem of cartItems) {
        const productId = toObjectId(cartItem.productId?._id || cartItem.productId);
        const variantId = toObjectId(cartItem.variantId);
        const qty = Number(cartItem.quantity || 0);
        const updated = await Product.findOneAndUpdate(
            {
                _id: productId,
                variants: {
                    $elemMatch: {
                        _id: variantId,
                        stock: { $gte: qty },
                    },
                },
            },
            { $inc: { 'variants.$.stock': -qty } },
            { session }
        );
        if (!updated) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient stock while creating order');
        }
    }
};

const createOrderFromCart = async (userId, { shipping_address, payment_method = 'cod', note }) => {
    const normalizedPaymentMethod = normalizePaymentMethod(payment_method);
    ensureSupportedPaymentMethod(normalizedPaymentMethod);
    const onlinePayment = isOnlinePaymentMethod(normalizedPaymentMethod);
    const reservationExpiry = new Date(Date.now() + Number(config.payment.pendingTtlMinutes || 15) * 60 * 1000);

    return runWithTransaction(async (session) => {
        const cart = await Cart.findOne({ user_id: userId })
            .populate({
                path: 'items.productId',
                select: 'name media base_price variants store_id',
            })
            .session(session || null);

        if (!cart || cart.items.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Gio hang trong. Khong the tao don hang.');
        }

        const orderItemsByStore = {};
        for (const cartItem of cart.items) {
            const product = cartItem.productId;
            if (!product) {
                continue;
            }

            const variant = product.variants.find((v) => v._id.toString() === cartItem.variantId.toString());
            if (!variant) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Bien the san pham "${product.name}" khong ton tai.`);
            }
            if (variant.stock < cartItem.quantity) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `San pham "${product.name}" (${variant.variantName || ''}) chi con ${variant.stock} san pham.`
                );
            }

            const price = variant.price || product.base_price;
            const subtotal = price * cartItem.quantity;
            const storeId = product.store_id?.toString();
            if (!storeId) {
                continue;
            }

            if (!orderItemsByStore[storeId]) {
                orderItemsByStore[storeId] = [];
            }

            orderItemsByStore[storeId].push({
                productId: product._id,
                variantId: cartItem.variantId,
                qty: cartItem.quantity,
                price,
                subtotal,
                snapshot: {
                    name: product.name,
                    variantName: variant.variantName || '',
                    attributes: variant.attributes || {},
                    image: product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url || '',
                },
            });
        }

        if (Object.keys(orderItemsByStore).length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Khong co san pham hop le trong gio hang.');
        }

        const orders = [];
        for (const [storeId, items] of Object.entries(orderItemsByStore)) {
            const storeTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
            const storeFee = storeTotal >= 1000000 ? 0 : 30000;
            const status = onlinePayment ? 'pending_payment' : 'created';
            const statusNote = onlinePayment
                ? `Order created and waiting for ${normalizedPaymentMethod} payment confirmation`
                : 'Order created by customer';

            const order = await new Order({
                user_id: userId,
                store_id: storeId,
                shipping_address,
                items,
                total_amount: storeTotal + storeFee,
                shipping_fee: storeFee,
                payment_method: normalizedPaymentMethod,
                payment_status: 'unpaid',
                status,
                status_history: [
                    {
                        oldStatus: null,
                        newStatus: status,
                        changedBy: 'customer',
                        note: note || statusNote,
                    },
                ],
            }).save({ session });

            orders.push(order);

            if (onlinePayment) {
                await stockReservationService.reserveStockForOrder(order, userId, {
                    expiresAt: reservationExpiry,
                    session,
                    reason: 'ORDER_PENDING_PAYMENT',
                });
            }
        }

        if (!onlinePayment) {
            await reserveOrDeductStock(cart.items, { session });
        }

        const itemCount = cart.items.length;
        cart.items = [];
        await cart.save({ session });

        const grandTotal = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        return {
            orders,
            totalAmount: grandTotal,
            itemCount,
            paymentMethod: normalizedPaymentMethod,
        };
    });
};

const getMyOrders = async (userId) => {
    const orders = await Order.find({ user_id: userId }).sort({ created_at: -1 }).populate('store_id', 'name uuid');
    return orders.map((order) => ({
        id: order._id,
        uuid: order.uuid,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        store_id: order.store_id?._id || null,
        store_uuid: order.store_id?.uuid || null,
        total_amount: order.total_amount,
        shipping_fee: order.shipping_fee,
        shipping_address: order.shipping_address,
        store_name: order.store_id?.name || 'Unknown Store',
        items: order.items,
        created_at: order.created_at,
    }));
};

module.exports = {
    createOrderFromCart,
    getMyOrders,
};
