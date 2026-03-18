const httpStatus = require('http-status');
const { Refund, Order, Payment } = require('../models');
const ApiError = require('../utils/ApiError');
const walletService = require('./wallet.service');
const { runWithTransaction } = require('../utils/transaction');

/**
 * Process a refund for an order
 * @param {ObjectId} orderId
 * @param {Number} amount
 * @param {String} reason
 * @param {String} processedBy - 'system', 'admin', 'seller'
 * @returns {Promise<Refund>}
 */
const processRefund = async (orderId, amount, reason, processedBy = 'system') => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

    const payment = await Payment.findOne({ order_id: orderId, status: 'PAID' });

    return runWithTransaction(async (session) => {
        const refund = await Refund.create([{
            order_id: orderId,
            payment_id: payment ? payment._id : null,
            amount,
            reason,
            status: 'COMPLETED',
            processed_at: new Date()
        }], { session });

        // If payment was via wallet, refund the balance
        if (order.payment_method === 'wallet') {
            await walletService.deposit(order.user_id, amount, `Refund for order ${order.uuid}`, { session });
        }

        // Update order status
        order.payment_status = 'refunded';
        order.status_history.push({
            oldStatus: order.status,
            newStatus: order.status,
            changedBy: processedBy,
            note: `Refund of ${amount} processed. Reason: ${reason}`
        });
        await order.save({ session });

        if (payment) {
            payment.status = 'REFUNDED';
            await payment.save({ session });
        }

        return refund[0];
    });
};

/**
 * Create a pending refund record (for manual processing like bank transfer/vnpay)
 */
const createPendingRefund = async (orderId, amount, reason) => {
    return Refund.create({
        order_id: orderId,
        amount,
        reason,
        status: 'PENDING'
    });
};

module.exports = {
    processRefund,
    createPendingRefund
};
