const config = require('../config/config');
const { OutboxEvent, Order, User, Notification, Store, StoreMember } = require('../models');
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

const createNotificationsForRecipients = async (userIds, payload) => {
    const dedupedUserIds = Array.from(
        new Set((userIds || []).filter(Boolean).map((userId) => userId.toString()))
    );

    if (!dedupedUserIds.length) {
        return;
    }

    await Notification.insertMany(
        dedupedUserIds.map((userId) => ({
            user_id: userId,
            ...payload,
        }))
    );
};

const getStoreRecipientIds = async (storeId) => {
    if (!storeId) {
        return [];
    }

    const [store, members] = await Promise.all([
        Store.findById(storeId).select('owner_user_id').lean(),
        StoreMember.find({ store_id: storeId, status: 'ACTIVE' }).select('user_id').lean(),
    ]);

    return [
        store?.owner_user_id,
        ...members.map((member) => member.user_id),
    ].filter(Boolean);
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
        const subject = `Thanh toán đơn hàng #${order.uuid.substring(0, 8)} đã được xác nhận`;
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #333;">
                <h2 style="margin-top: 0; color: #111;">Thanh toán thành công</h2>
                <p>Đơn hàng <strong>#${order.uuid.substring(0, 8)}</strong> của bạn đã được xác nhận thanh toán và đang được xử lý.</p>
                <p>Bạn có thể theo dõi tiến trình đơn hàng trong trang tài khoản của mình.</p>
                <div style="margin-top: 24px;">
                    <a href="${config.frontendUrl || 'http://localhost:3000'}/profile" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700;">Xem đơn hàng</a>
                </div>
            </div>
        `;
        await emailService.sendEmail(user.email, subject, html);
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
        await emailService.sendOrderCreatedEmail(user.email, order);
    }

    await Notification.create({
        user_id: user._id,
        type: 'ORDER_STATUS',
        message: `Your order ${order.uuid} has been successfully placed.`,
    });

    const sellerRecipientIds = await getStoreRecipientIds(order.store_id);
    await createNotificationsForRecipients(sellerRecipientIds, {
        type: 'SELLER_ORDER_CREATED',
        message: `New order ${order.uuid} has been placed and is waiting for your action.`,
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

    const [user, order] = await Promise.all([
        User.findById(userId),
        Order.findById(orderId).select('store_id uuid'),
    ]);
    if (!user) return;

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const message = `Đơn hàng ${orderUuid} đã chuyển sang trạng thái: ${statusLabel}.`;

    await Notification.create({
        user_id: user._id,
        type: 'ORDER_STATUS',
        message,
    });

    if (user.email) {
        if (newStatus === 'cancelled' && order) {
            let cancelReason = 'Đơn hàng đã bị hủy.';
            if (changedBy === 'customer') {
                cancelReason = 'Bạn đã chủ động hủy đơn hàng.';
            } else if (changedBy === 'system') {
                cancelReason = 'Đơn hàng bị hủy tự động bởi hệ thống hoặc do thanh toán không thành công.';
            } else if (changedBy === 'seller') {
                cancelReason = 'Đơn hàng đã bị hủy bởi cửa hàng.';
            }
            await emailService.sendOrderCancelledEmail(user.email, order, cancelReason);
        } else {
            const subject = `Đơn hàng ${orderUuid} - ${statusLabel}`;
            const html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #333;">
                    <h2 style="margin-top: 0; color: #111;">Cập nhật trạng thái đơn hàng</h2>
                    <p>Đơn hàng <strong>${orderUuid}</strong> của bạn đã chuyển sang trạng thái: <strong>${statusLabel}</strong>.</p>
                    <div style="margin-top: 24px;">
                        <a href="${config.frontendUrl || 'http://localhost:3000'}/profile" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700;">Theo dõi đơn hàng</a>
                    </div>
                </div>
            `;
            await emailService.sendEmail(user.email, subject, html);
        }
    }
    if (order && changedBy !== 'seller') {
        const sellerRecipientIds = await getStoreRecipientIds(order.store_id);
        let sellerMessage = `Order ${order.uuid} changed to status: ${statusLabel}.`;

        if (newStatus === 'cancelled' && changedBy === 'customer') {
            sellerMessage = `Buyer cancelled order ${order.uuid}. Please review inventory and related operations.`;
        } else if (newStatus === 'confirmed' && changedBy === 'system' && oldStatus === 'pending_payment') {
            sellerMessage = `Order ${order.uuid} has been paid successfully and is ready for fulfillment.`;
        } else if (newStatus === 'cancelled' && changedBy === 'system') {
            sellerMessage = `Order ${order.uuid} was cancelled automatically by the system.`;
        }

        await createNotificationsForRecipients(sellerRecipientIds, {
            type: 'SELLER_ORDER_STATUS',
            message: sellerMessage,
        });
    }
};

const handleOrderReturnRequestedEvent = async (event) => {
    const { orderId } = event.payload || {};
    if (!orderId) return;

    const order = await Order.findById(orderId).select('store_id uuid');
    if (!order) return;

    const sellerRecipientIds = await getStoreRecipientIds(order.store_id);
    await createNotificationsForRecipients(sellerRecipientIds, {
        type: 'SELLER_RETURN_REQUESTED',
        message: `Buyer requested a return for order ${order.uuid}. Please review and process it soon.`,
    });
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
        case 'ORDER_RETURN_REQUESTED':
            await handleOrderReturnRequestedEvent(event);
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
