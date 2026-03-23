const httpStatus = require('http-status');
const { Shipment, ShipmentEvent, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { runWithTransaction } = require('../utils/transaction');
const settlementService = require('./settlement.service');

/**
 * Create a new shipment for an order
 * @param {ObjectId} orderId
 * @param {ObjectId} providerId
 * @param {String} trackingNumber
 * @returns {Promise<Shipment>}
 */
const createShipment = async (orderId, providerId, trackingNumber) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

    // Validate order status (should be confirmed or ready to ship)
    if (!['confirmed', 'shipped'].includes(order.status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Order must be confirmed before shipping');
    }

    const existingShipment = await Shipment.findOne({ order_id: orderId });
    if (existingShipment) throw new ApiError(httpStatus.BAD_REQUEST, 'Shipment already exists for this order');

    return runWithTransaction(async (session) => {
        const shipment = await Shipment.create([{
            order_id: orderId,
            provider_id: providerId,
            tracking_number: trackingNumber,
            status: 'PICKED_UP',
            shipped_at: new Date()
        }], { session });

        // Update order status to shipped
        const oldStatus = order.status;
        order.status = 'shipped';
        order.status_history.push({
            oldStatus,
            newStatus: 'shipped',
            changedBy: 'seller',
            note: `Order shipped. Tracking Number: ${trackingNumber}`
        });
        await order.save({ session });

        // Create first event
        await ShipmentEvent.create([{
            shipment_id: shipment[0]._id,
            status: 'PICKED_UP',
            location: 'Warehouse',
            note: 'Package picked up by carrier'
        }], { session });

        return shipment[0];
    });
};

/**
 * Add a tracking event to a shipment
 * @param {ObjectId} shipmentId
 * @param {String} status
 * @param {String} location
 * @param {String} note
 */
const addShipmentEvent = async (shipmentId, status, location, note) => {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');

    return runWithTransaction(async (session) => {
        const event = await ShipmentEvent.create([{
            shipment_id: shipmentId,
            status,
            location,
            note
        }], { session });

        shipment.status = status;
        shipment.last_event_at = new Date();

        if (status === 'DELIVERED') {
            shipment.delivered_at = new Date();

            // Sync with Order
            const order = await Order.findById(shipment.order_id);
            if (order) {
                const oldStatus = order.status;
                order.status = 'delivered';
                order.payment_status = order.payment_method === 'cod' ? 'paid' : order.payment_status;
                order.status_history.push({
                    oldStatus,
                    newStatus: 'delivered',
                    changedBy: 'system',
                    note: 'Order delivered according to carrier tracking'
                });
                await order.save({ session });
                await settlementService.createSettlementForPaidOrder(order._id, null, { session });
                await settlementService.releaseSettlementToWallet(order._id, { session });
            }
        }

        await shipment.save({ session });
        return event[0];
    });
};

/**
 * Get shipment details for an order
 */
const getShipmentByOrder = async (orderId) => {
    return Shipment.findOne({ order_id: orderId }).populate('provider_id');
};

/**
 * Get tracking events
 */
const getShipmentEvents = async (shipmentId) => {
    return ShipmentEvent.find({ shipment_id: shipmentId }).sort({ occurred_at: -1 });
};

module.exports = {
    createShipment,
    addShipmentEvent,
    getShipmentByOrder,
    getShipmentEvents
};
