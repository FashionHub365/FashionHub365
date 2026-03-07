const { Order, Payment } = require('../models');
const paymentService = require('./payment.service');
const stockReservationService = require('./stockReservation.service');
const { runWithTransaction } = require('../utils/transaction');

const reconcilePaymentFlow = async (options = {}) => {
    const { limit = 200 } = options;

    const reservationResult = await stockReservationService.expireActiveReservations({ limit });
    if (reservationResult.orderIds.length) {
        for (const orderId of reservationResult.orderIds) {
            await runWithTransaction(async (session) => {
                const order = await Order.findById(orderId).session(session || null);
                if (!order || order.payment_status === 'paid') {
                    return;
                }

                const hasPendingOrPaidPayment = await Payment.countDocuments({
                    order_id: order._id,
                    status: { $in: ['PENDING', 'PAID'] },
                }).session(session || null);

                if (hasPendingOrPaidPayment > 0) {
                    return;
                }

                if (order.status === 'pending_payment') {
                    order.status_history.push({
                        oldStatus: 'pending_payment',
                        newStatus: 'cancelled',
                        changedBy: 'system',
                        note: 'Auto-cancelled due to reservation expiration',
                    });
                    order.status = 'cancelled';
                }
                order.payment_status = 'failed';
                await order.save({ session });
            });
        }
    }

    const paymentExpireResult = await paymentService.expirePendingPayments({ limit });
    const repairResult = await paymentService.repairPaidPaymentOrderState({ limit });

    return {
        expiredReservations: reservationResult.expiredCount,
        expiredPayments: paymentExpireResult.expiredCount,
        repairedPaidState: repairResult.repairedCount,
    };
};

module.exports = {
    reconcilePaymentFlow,
};
