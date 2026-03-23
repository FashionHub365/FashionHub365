const express = require('express');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { auth, authorize, denyRoles } = require('../middleware/auth');
const {
    orderService,
    paymentService,
    vnpayService,
} = require('../services');

const router = express.Router();
const ALLOWED_PAYMENT_METHODS = ['cod', 'bank_transfer', 'vnpay'];

router.use(
    auth(),
    denyRoles(
        ['super-admin', 'admin', 'staff', 'operator', 'finance', 'cs', 'seller', 'store-owner'],
        'Admin and seller accounts are not allowed to place customer orders'
    )
);

router.post('/', authorize(['ORDER.CREATE']), catchAsync(async (req, res) => {
    const {
        shipping_address,
        payment_method,
        note,
        voucher_code,
        returnUrl,
    } = req.body;

    if (!shipping_address) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Vui long cung cap dia chi giao hang.',
        });
    }

    const normalizedPaymentMethod = `${payment_method || 'cod'}`.trim().toLowerCase();
    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Phuong thuc thanh toan khong hop le: ${payment_method}`,
        });
    }

    if (normalizedPaymentMethod === 'cod') {
        const result = await orderService.createOrderFromCart(req.user._id, {
            shipping_address,
            payment_method: normalizedPaymentMethod,
            note,
            voucher_code,
        });

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Dat hang thanh cong!',
            data: result,
        });
    }

    const result = await orderService.createOrderFromCart(req.user._id, {
        shipping_address,
        payment_method: normalizedPaymentMethod,
        note,
        voucher_code,
    }, {
        clearCart: false,
        emitOrderCreatedEvent: false,
    });

    const orderIds = result.orders.map((order) => order._id);

    try {
        if (normalizedPaymentMethod === 'vnpay') {
            if (result.orders.length !== 1) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'VNPAY currently supports one-store checkout only. Please checkout items by store.'
                );
            }

            const order = result.orders[0];
            const payment = await vnpayService.createVNPayPayment({
                orderId: order.uuid,
                amount: Number(order.total_amount || 0),
                currency: order.currency || 'VND',
                locale: 'vn',
                returnUrl: returnUrl || `${config.frontendUrl}/payment-result`,
                userId: req.user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            await orderService.clearUserCart(req.user._id);

            return res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Don hang da duoc tao. Vui long hoan tat thanh toan qua VNPAY.',
                data: {
                    ...result,
                    payment,
                },
            });
        }

        const payments = await Promise.all(
            result.orders.map((order) => paymentService.createPayment({
                orderId: order.uuid,
                paymentMethodCode: 'BANK_TRANSFER',
                amount: Number(order.total_amount || 0),
                currency: order.currency || 'VND',
                userId: req.user._id,
            }))
        );

        await orderService.clearUserCart(req.user._id);

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Don hang da duoc tao. Vui long chuyen khoan de hoan tat thanh toan.',
            data: {
                ...result,
                payments,
            },
        });
    } catch (error) {
        await orderService.rollbackPendingOnlineOrders(req.user._id, orderIds, {
            reason: error.message || `Failed to initialize ${normalizedPaymentMethod} payment`,
        });
        throw error;
    }
}));

router.get('/my', authorize(['ORDER.VIEW_OWN']), catchAsync(async (req, res) => {
    const result = await orderService.getMyOrders(req.user._id, req.query);
    res.json({ success: true, data: result });
}));

router.get('/:id', authorize(['ORDER.VIEW_OWN']), catchAsync(async (req, res) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid order ID' });
    }
    const order = await orderService.getMyOrderById(req.user._id, req.params.id);
    res.json({ success: true, data: order });
}));

router.post('/:id/cancel', authorize(['ORDER.CREATE']), catchAsync(async (req, res) => {
    const mongoose = require('mongoose');
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Invalid order ID',
        });
    }

    const order = await orderService.cancelMyOrder(req.user._id, orderId);
    res.json({
        success: true,
        message: 'Don hang da duoc huy thanh cong.',
        data: order,
    });
}));

module.exports = router;
