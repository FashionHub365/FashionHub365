const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { auth, authorize } = require('../middleware/auth');
const { orderService } = require('../services');

const express = require('express');
const router = express.Router();
const ALLOWED_PAYMENT_METHODS = ['cod', 'bank_transfer', 'vnpay'];

// Tất cả route order đều cần đăng nhập
router.use(auth());

/**
 * POST /api/v1/orders
 * Tạo đơn hàng từ giỏ hàng
 * Body: { shipping_address, payment_method, note }
 */
router.post('/', authorize(['ORDER.CREATE']), catchAsync(async (req, res) => {
    const { shipping_address, payment_method, note } = req.body;

    if (!shipping_address) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Vui lòng cung cấp địa chỉ giao hàng.'
        });
    }
    const normalizedPaymentMethod = `${payment_method || 'cod'}`.trim().toLowerCase();
    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Phương thức thanh toán không hợp lệ: ${payment_method}`,
        });
    }

    const result = await orderService.createOrderFromCart(req.user._id, {
        shipping_address,
        payment_method: normalizedPaymentMethod,
        note,
    });

    res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Đặt hàng thành công!',
        data: result,
    });
}));

/**
 * GET /api/v1/orders/my
 * Lấy lịch sử đơn hàng của user hiện tại
 */
router.get('/my', authorize(['ORDER.VIEW_OWN']), catchAsync(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);
    res.json({ success: true, data: orders });
}));

module.exports = router;
