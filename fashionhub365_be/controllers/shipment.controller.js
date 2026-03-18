const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const shipmentService = require('../services/shipment.service');
const { ShippingProvider } = require('../models');

const createShipment = catchAsync(async (req, res) => {
    const { orderId, providerId, trackingNumber } = req.body;
    const shipment = await shipmentService.createShipment(orderId, providerId, trackingNumber);
    res.status(httpStatus.CREATED).send({ success: true, data: { shipment } });
});

const addEvent = catchAsync(async (req, res) => {
    const { status, location, note } = req.body;
    const event = await shipmentService.addShipmentEvent(req.params.shipmentId, status, location, note);
    res.send({ success: true, data: { event } });
});

const getOrderTracking = catchAsync(async (req, res) => {
    const shipment = await shipmentService.getShipmentByOrder(req.params.orderId);
    if (!shipment) {
        return res.send({ success: true, data: { tracking: null } });
    }
    const events = await shipmentService.getShipmentEvents(shipment._id);
    res.send({ success: true, data: { shipment, events } });
});

const getProviders = catchAsync(async (req, res) => {
    const providers = await ShippingProvider.find();
    res.send({ success: true, data: { providers } });
});

module.exports = {
    createShipment,
    addEvent,
    getOrderTracking,
    getProviders
};
