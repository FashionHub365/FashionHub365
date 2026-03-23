const httpStatus = require('http-status');
const mongoose = require('mongoose');
const config = require('../config/config');
const {
    Cart, Order, Product, Return, Payment, Voucher, VoucherUsage,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { runWithTransaction } = require('../utils/transaction');
const stockReservationService = require('./stockReservation.service');

const outboxService = require('./outbox.service');
const voucherService = require('./voucher.service');
const refundService = require('./refund.service');
const shippingService = require('./shipping.service');

const SUPPORTED_PAYMENT_METHODS = ['cod', 'bank_transfer', 'vnpay', 'wallet'];

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

const clearUserCart = async (userId, options = {}) => {
    const { session } = options;
    const cartQuery = Cart.findOne({ user_id: userId });
    if (session) {
        cartQuery.session(session);
    }

    const cart = await cartQuery;
    if (!cart) {
        return false;
    }

    cart.items = [];
    await cart.save({ session });
    return true;
};

const rollbackVoucherUsageForOrders = async (orderIds, options = {}) => {
    const { session } = options;
    const usageQuery = VoucherUsage.find({ order_id: { $in: orderIds } });
    if (session) {
        usageQuery.session(session);
    }

    const usages = await usageQuery;
    if (!usages.length) {
        return 0;
    }

    const decrementMap = new Map();
    usages.forEach((usage) => {
        const voucherId = usage.voucher_id?.toString();
        if (!voucherId) {
            return;
        }
        decrementMap.set(voucherId, (decrementMap.get(voucherId) || 0) + 1);
    });

    for (const [voucherId, count] of decrementMap.entries()) {
        await Voucher.updateOne(
            { _id: voucherId },
            { $inc: { used_count: -count } },
            { session }
        );
    }

    const deleteQuery = VoucherUsage.deleteMany({ _id: { $in: usages.map((usage) => usage._id) } });
    if (session) {
        deleteQuery.session(session);
    }
    await deleteQuery;

    return usages.length;
};

const rollbackPendingOnlineOrders = async (userId, orderIds, options = {}) => {
    const normalizedOrderIds = (orderIds || [])
        .map((orderId) => toObjectId(orderId))
        .filter(Boolean);

    if (!normalizedOrderIds.length) {
        return { rolledBackCount: 0 };
    }

    const reason = options.reason || 'Payment initialization failed';

    return runWithTransaction(async (session) => {
        const ordersQuery = Order.find({
            _id: { $in: normalizedOrderIds },
            user_id: userId,
        });
        if (session) {
            ordersQuery.session(session);
        }

        const orders = await ordersQuery;
        if (!orders.length) {
            return { rolledBackCount: 0 };
        }

        const rolledBackOrderIds = [];
        for (const order of orders) {
            if (order.payment_status === 'paid' || !['pending_payment', 'created'].includes(order.status)) {
                continue;
            }

            await stockReservationService.releaseReservationsForOrder(order._id, {
                session,
                reason: 'PAYMENT_INIT_FAILED',
                nextStatus: 'RELEASED',
            });

            const oldStatus = order.status;
            order.status = 'cancelled';
            order.payment_status = 'failed';
            order.status_history.push({
                oldStatus,
                newStatus: 'cancelled',
                changedBy: 'system',
                note: reason,
            });
            await order.save({ session });
            rolledBackOrderIds.push(order._id);
        }

        if (rolledBackOrderIds.length > 0) {
            const paymentDeleteQuery = Payment.deleteMany({
                order_id: { $in: rolledBackOrderIds },
                status: 'PENDING',
            });
            if (session) {
                paymentDeleteQuery.session(session);
            }
            await paymentDeleteQuery;
            await rollbackVoucherUsageForOrders(rolledBackOrderIds, { session });
        }

        return { rolledBackCount: rolledBackOrderIds.length };
    });
};

const createOrderFromCart = async (userId, { shipping_address, payment_method = 'cod', note, voucher_code }, options = {}) => {
    const {
        clearCart = true,
        emitOrderCreatedEvent = true,
    } = options;
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

        let totalCartAmount = 0;
        const productsMap = new Map();

        // First pass: validate stock and calculate total cart amount
        for (const cartItem of cart.items) {
            const product = cartItem.productId;
            if (!product) continue;

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
            totalCartAmount += price * cartItem.quantity;
            productsMap.set(cartItem._id.toString(), { product, variant, price });
        }

        // Apply voucher if provided
        let totalDiscount = 0;
        let voucherId = null;
        if (voucher_code) {
            const voucherResult = await voucherService.applyVoucher(voucher_code, userId, totalCartAmount);
            totalDiscount = voucherResult.discount;
            voucherId = voucherResult.voucher._id;
        }

        const orderItemsByStore = {};
        for (const cartItem of cart.items) {
            const { product, variant, price } = productsMap.get(cartItem._id.toString());
            const subtotal = price * cartItem.quantity;
            const storeId = product.store_id?.toString();
            if (!storeId) continue;

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
            const baseShippingFee = await shippingService.calculateShippingFee(shipping_address);
            const storeFee = storeTotal >= 1000000 ? 0 : baseShippingFee;
            const status = onlinePayment ? 'pending_payment' : 'created';
            const statusNote = onlinePayment
                ? `Order created and waiting for ${normalizedPaymentMethod} payment confirmation`
                : 'Order created by customer';

            // Proportional discount distribution
            const storeDiscount = totalCartAmount > 0
                ? Math.round((storeTotal / totalCartAmount) * totalDiscount)
                : 0;

            const order = await new Order({
                user_id: userId,
                store_id: storeId,
                shipping_address,
                items,
                total_amount: storeTotal + storeFee - storeDiscount,
                shipping_fee: storeFee,
                discount_total: storeDiscount,
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
        if (clearCart) {
            await clearUserCart(userId, { session });
        }

        if (emitOrderCreatedEvent) {
            for (const order of orders) {
                await outboxService.enqueueEventIfNotExists(
                    {
                        aggregateType: 'ORDER',
                        aggregateId: order._id.toString(),
                        eventType: 'ORDER_CREATED',
                        payload: {
                            orderId: order._id.toString(),
                            orderUuid: order.uuid,
                            userId: userId.toString(),
                        },
                    },
                    { session }
                );
            }
        }

        if (voucherId) {
            await voucherService.recordUsage(voucherId, userId, orders[0]._id);
        }

        const grandTotal = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        return {
            orders,
            totalAmount: grandTotal,
            itemCount,
            paymentMethod: normalizedPaymentMethod,
        };
    });
};

const cancelMyOrder = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    const CUSTOMER_CANCELLABLE = ['created', 'pending_payment'];
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot cancel order in status "${order.status}". Only orders in "created" or "pending_payment" can be cancelled.`
        );
    }

    if (order.payment_status === 'paid') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel a paid order. Please request a refund instead.');
    }

    return runWithTransaction(async (session) => {
        const lockedOrder = await Order.findById(orderId).session(session || null);
        if (!lockedOrder || !CUSTOMER_CANCELLABLE.includes(lockedOrder.status)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Order can no longer be cancelled');
        }

        // Release stock reservations (online payment orders)
        const releasedCount = await stockReservationService.releaseReservationsForOrder(lockedOrder._id, {
            session,
            reason: 'CUSTOMER_CANCELLED_ORDER',
            nextStatus: 'RELEASED',
        });

        // Restore stock for COD orders (direct deduction)
        if (releasedCount === 0 && lockedOrder.status === 'created') {
            for (const item of lockedOrder.items || []) {
                const qty = Number(item.qty || 0);
                if (!item.productId || !item.variantId || qty <= 0) continue;
                await Product.updateOne(
                    { _id: item.productId, 'variants._id': item.variantId },
                    { $inc: { 'variants.$.stock': qty } },
                    { session }
                );
            }
        }

        const oldStatus = lockedOrder.status;
        lockedOrder.status = 'cancelled';
        lockedOrder.payment_status = 'failed';
        lockedOrder.status_history.push({
            oldStatus,
            newStatus: 'cancelled',
            changedBy: 'customer',
            note: 'Order cancelled by customer',
        });
        await lockedOrder.save({ session });

        // Enqueue notification event
        await outboxService.enqueueEventIfNotExists(
            {
                aggregateType: 'ORDER',
                aggregateId: lockedOrder._id.toString(),
                eventType: 'ORDER_STATUS_CHANGED',
                payload: {
                    orderId: lockedOrder._id.toString(),
                    orderUuid: lockedOrder.uuid,
                    userId: userId.toString(),
                    oldStatus,
                    newStatus: 'cancelled',
                    changedBy: 'customer',
                },
            },
            { session }
        );

        return lockedOrder;
    });
};

const getMyOrders = async (userId, query = {}) => {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const filter = { user_id: userId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('store_id', 'name uuid'),
        Order.countDocuments(filter)
    ]);

    return {
        items: orders.map((order) => ({
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
        })),
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        }
    };
};

const getMyOrderById = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, user_id: userId })
        .populate('store_id', 'name uuid avatar_url');

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    return {
        id: order._id,
        uuid: order.uuid,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        store_id: order.store_id?._id || null,
        store_uuid: order.store_id?.uuid || null,
        store_name: order.store_id?.name || 'Unknown Store',
        total_amount: order.total_amount,
        shipping_fee: order.shipping_fee,
        discount_total: order.discount_total,
        shipping_address: order.shipping_address,
        items: order.items,
        status_history: order.status_history,
        created_at: order.created_at,
    };
};

const requestReturn = async (userId, orderId, reason) => {
    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    if (order.status !== 'delivered') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only delivered orders can be returned');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (order.updated_at < sevenDaysAgo) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Return period (7 days) has expired');
    }

    const existingReturn = await Return.findOne({ order_id: orderId });
    if (existingReturn) throw new ApiError(httpStatus.BAD_REQUEST, 'Return already requested for this order');

    return runWithTransaction(async (session) => {
        const returnReq = await Return.create([{
            order_id: orderId,
            reason,
            status: 'PENDING',
            requested_at: new Date()
        }], { session });

        const oldStatus = order.status;
        order.status = 'return_requested';
        order.status_history.push({
            oldStatus,
            newStatus: 'return_requested',
            changedBy: 'customer',
            note: `Return requested. Reason: ${reason}`
        });
        await order.save({ session });

        await outboxService.enqueueEventIfNotExists({
            aggregateType: 'ORDER',
            aggregateId: order._id.toString(),
            eventType: 'ORDER_RETURN_REQUESTED',
            payload: { orderId: order._id.toString(), returnId: returnReq[0]._id.toString() }
        }, { session });

        return returnReq[0];
    });
};

const processReturn = async (actorId, returnId, action, note) => {
    const returnReq = await Return.findById(returnId);
    if (!returnReq) throw new ApiError(httpStatus.NOT_FOUND, 'Return request not found');
    if (returnReq.status !== 'PENDING') throw new ApiError(httpStatus.BAD_REQUEST, 'Return request already processed');

    const order = await Order.findById(returnReq.order_id);
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Associated order not found');

    return runWithTransaction(async (session) => {
        if (action === 'APPROVE') {
            returnReq.status = 'APPROVED';
            returnReq.resolved_at = new Date();

            const oldStatus = order.status;
            order.status = 'returned';
            order.status_history.push({
                oldStatus,
                newStatus: 'returned',
                changedBy: 'seller',
                note: note || 'Return approved'
            });
            await order.save({ session });

            // Process refund
            await refundService.processRefund(order._id, order.total_amount, `Return Approved: ${returnReq.reason}`, 'seller');
        } else if (action === 'REJECT') {
            returnReq.status = 'REJECTED';
            returnReq.resolved_at = new Date();

            const oldStatus = order.status;
            order.status = 'delivered'; // Revert to delivered
            order.status_history.push({
                oldStatus,
                newStatus: 'delivered',
                changedBy: 'seller',
                note: `Return rejected. Note: ${note}`
            });
            await order.save({ session });
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid action. Use APPROVE or REJECT');
        }

        await returnReq.save({ session });
        return returnReq;
    });
};

module.exports = {
    createOrderFromCart,
    cancelMyOrder,
    getMyOrders,
    getMyOrderById,
    clearUserCart,
    rollbackPendingOnlineOrders,
    requestReturn,
    processReturn,
};
