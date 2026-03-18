const config = require('../config/config');
const { OutboxEvent, Order, User, Notification } = require('../models');
const emailService = require('./email.service');

const DEFAULT_MAX_RETRY = config.outbox?.maxRetry || 10;
const PROCESSING_TIMEOUT_SECONDS = Number(config.outbox?.processingTimeoutSeconds || 300);

const enqueueEvent = async (event, options = {}) => {
    const { session } = options;
    const payload = event.payload || {};
    const doc = await OutboxEvent.create(
        [
            {
                aggregate_type: event.aggregateType,
                aggregate_id: String(event.aggregateId),
                event_type: event.eventType,
                payload,
                max_retry: event.maxRetry || DEFAULT_MAX_RETRY,
                next_retry_at: event.nextRetryAt || new Date(),
                status: 'PENDING',
            },
        ],
        { session }
    );
    return doc[0];
};

const enqueueEventIfNotExists = async (event, options = {}) => {
    const { session } = options;
    const existing = await OutboxEvent.findOne({
        aggregate_type: event.aggregateType,
        aggregate_id: String(event.aggregateId),
        event_type: event.eventType,
        status: { $in: ['PENDING', 'PROCESSING', 'DONE'] },
    }).session(session || null);

    if (existing) {
        return existing;
    }
    return enqueueEvent(event, options);
};

const handleOrderConfirmedEvent = async (event) => {
    const orderId = event.payload?.orderId || event.aggregate_id;
    const order = await Order.findById(orderId).populate('user_id');
    if (!order) {
        return;
    }

    const user = order.user_id?._id ? order.user_id : await User.findById(order.user_id);
    if (!user) {
        return;
    }

    if (user.email) {
        const subject = `Order ${order.uuid} confirmed`;
        const text = `Your payment has been confirmed and order ${order.uuid} is now CONFIRMED.`;
        await emailService.sendEmail(user.email, subject, text);
    }

    await Notification.create({
        user_id: user._id,
        type: 'ORDER_CONFIRMED',
        message: `Order ${order.uuid} payment confirmed.`,
    });
};

const handleOrderCreatedEvent = async (event) => {
    const orderId = event.payload?.orderId || event.aggregate_id;
    const order = await Order.findById(orderId).populate('user_id');
    if (!order) {
        return;
    }

    const user = order.user_id?._id ? order.user_id : await User.findById(order.user_id);
    if (!user) {
        return;
    }

    if (user.email) {
        const subject = `Order ${order.uuid} placed successfully`;
        const text = `Thank you for your order! Your order ${order.uuid} has been successfully placed.`;
        await emailService.sendEmail(user.email, subject, text);
    }

    await Notification.create({
        user_id: user._id,
        type: 'ORDER_STATUS',
        message: `Your order ${order.uuid} has been successfully placed.`,
    });
};

const STATUS_LABELS = {
    created: 'đã đặt',
    pending_payment: 'chờ thanh toán',
    confirmed: 'đã xác nhận',
    shipped: 'đang giao',
    delivered: 'đã giao',
    cancelled: 'đã hủy',
    refunded: 'đã hoàn tiền',
};

const handleOrderStatusChangedEvent = async (event) => {
    const { orderId, orderUuid, userId, oldStatus, newStatus, changedBy } = event.payload || {};
    if (!orderId || !userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const message = `Đơn hàng ${orderUuid} đã chuyển sang trạng thái: ${statusLabel}.`;

    await Notification.create({
        user_id: user._id,
        type: 'ORDER_STATUS',
        message,
    });

    if (user.email) {
        const subject = `Đơn hàng ${orderUuid} - ${statusLabel}`;
        await emailService.sendEmail(user.email, subject, message);
    }
};

const dispatchOutboxEvent = async (event) => {
    switch (event.event_type) {
        case 'ORDER_CONFIRMED':
            await handleOrderConfirmedEvent(event);
            return;
        case 'ORDER_CREATED':
            await handleOrderCreatedEvent(event);
            return;
        case 'ORDER_STATUS_CHANGED':
            await handleOrderStatusChangedEvent(event);
            return;
        default:
            return;
    }
};

const claimNextPendingEvent = async () => {
    const now = new Date();
    const staleProcessingBefore = new Date(now.getTime() - PROCESSING_TIMEOUT_SECONDS * 1000);
    return OutboxEvent.findOneAndUpdate(
        {
            $or: [
                {
                    status: 'PENDING',
                    next_retry_at: { $lte: now },
                },
                {
                    status: 'PROCESSING',
                    locked_at: { $lte: staleProcessingBefore },
                },
            ],
        },
        {
            $set: {
                status: 'PROCESSING',
                locked_at: now,
            },
        },
        {
            sort: { created_at: 1 },
            new: true,
        }
    );
};

const markEventDone = async (eventId) => {
    await OutboxEvent.updateOne(
        { _id: eventId },
        {
            $set: {
                status: 'DONE',
                processed_at: new Date(),
                last_error: null,
                locked_at: null,
            },
        }
    );
};

const markEventFailed = async (event) => {
    const retryCount = Number(event.retry_count || 0) + 1;
    const reachedMax = retryCount >= Number(event.max_retry || DEFAULT_MAX_RETRY);
    const backoffSeconds = Math.min(300, Math.max(5, retryCount * 5));
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

    await OutboxEvent.updateOne(
        { _id: event._id },
        {
            $set: {
                status: reachedMax ? 'FAILED' : 'PENDING',
                next_retry_at: reachedMax ? event.next_retry_at : nextRetryAt,
                last_error: `${event.__dispatchError || 'Unknown dispatch error'}`.slice(0, 1000),
                locked_at: null,
            },
            $inc: {
                retry_count: 1,
            },
        }
    );
};

const processOutboxBatch = async (options = {}) => {
    const { maxEvents = 20 } = options;
    let processed = 0;

    for (let i = 0; i < maxEvents; i += 1) {
        const event = await claimNextPendingEvent();
        if (!event) {
            break;
        }

        try {
            await dispatchOutboxEvent(event);
            await markEventDone(event._id);
            processed += 1;
        } catch (error) {
            event.__dispatchError = error.message;
            await markEventFailed(event);
        }
    }

    return { processed };
};

module.exports = {
    enqueueEvent,
    enqueueEventIfNotExists,
    processOutboxBatch,
};
