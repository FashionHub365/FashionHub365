const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Product, StockReservation } = require('../models');
const ApiError = require('../utils/ApiError');
const { runWithTransaction } = require('../utils/transaction');

const toObjectId = (value) => {
    if (value instanceof mongoose.Types.ObjectId) {
        return value;
    }
    if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return value;
};

const reserveStockForOrder = async (order, userId, options = {}) => {
    const { expiresAt, session, reason = 'ORDER_PENDING_PAYMENT' } = options;
    if (!expiresAt) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Reservation expiry time is required');
    }

    const reservationItems = [];
    for (const item of order.items) {
        const productId = toObjectId(item.productId);
        const variantId = toObjectId(item.variantId);
        const qty = Number(item.qty || 0);
        if (!productId || !variantId || qty <= 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid reservation item');
        }

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
            {
                $inc: { 'variants.$.stock': -qty },
            },
            { session }
        );

        if (!updated) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient stock to reserve order');
        }

        reservationItems.push({
            product_id: productId,
            variant_id: variantId,
            qty,
        });
    }

    return StockReservation.create(
        [
            {
                order_id: order._id,
                user_id: userId,
                store_id: order.store_id,
                status: 'ACTIVE',
                reason,
                items: reservationItems,
                expires_at: expiresAt,
            },
        ],
        { session }
    ).then((docs) => docs[0]);
};

const confirmReservationsForOrder = async (orderId, options = {}) => {
    const { session } = options;
    await StockReservation.updateMany(
        {
            order_id: toObjectId(orderId),
            status: 'ACTIVE',
        },
        {
            $set: {
                status: 'CONFIRMED',
                confirmed_at: new Date(),
                reason: 'PAYMENT_SUCCEEDED',
            },
        },
        { session }
    );
};

const releaseReservation = async (reservation, options = {}) => {
    const { session, reason = 'RELEASED', nextStatus = 'RELEASED' } = options;
    if (reservation.status !== 'ACTIVE') {
        return false;
    }

    for (const item of reservation.items) {
        await Product.updateOne(
            {
                _id: item.product_id,
                'variants._id': item.variant_id,
            },
            { $inc: { 'variants.$.stock': Number(item.qty || 0) } },
            { session }
        );
    }

    reservation.status = nextStatus;
    reservation.reason = reason;
    reservation.released_at = new Date();
    await reservation.save({ session });
    return true;
};

const releaseReservationsForOrder = async (orderId, options = {}) => {
    const { session, reason = 'PAYMENT_CANCELLED', nextStatus = 'RELEASED' } = options;
    const reservations = await StockReservation.find({
        order_id: toObjectId(orderId),
        status: 'ACTIVE',
    }).session(session || null);

    let releasedCount = 0;
    for (const reservation of reservations) {
        const released = await releaseReservation(reservation, { session, reason, nextStatus });
        if (released) {
            releasedCount += 1;
        }
    }
    return releasedCount;
};

const expireActiveReservations = async (options = {}) => {
    const { limit = 100 } = options;
    const now = new Date();
    const reservations = await StockReservation.find({
        status: 'ACTIVE',
        expires_at: { $lte: now },
    })
        .sort({ expires_at: 1 })
        .limit(limit);

    const affectedOrderIds = new Set();
    let expiredCount = 0;

    for (const reservation of reservations) {
        await runWithTransaction(async (session) => {
            const locked = await StockReservation.findOne({
                _id: reservation._id,
                status: 'ACTIVE',
            }).session(session || null);
            if (!locked) {
                return;
            }

            const changed = await releaseReservation(locked, {
                session,
                reason: 'RESERVATION_EXPIRED',
                nextStatus: 'EXPIRED',
            });

            if (changed) {
                expiredCount += 1;
                affectedOrderIds.add(String(locked.order_id));
            }
        });
    }

    return {
        expiredCount,
        orderIds: Array.from(affectedOrderIds),
    };
};

module.exports = {
    reserveStockForOrder,
    confirmReservationsForOrder,
    releaseReservationsForOrder,
    expireActiveReservations,
};
