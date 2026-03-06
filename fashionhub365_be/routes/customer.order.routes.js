const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { auth } = require('../middleware/auth');
const { orderService } = require('../services');

const express = require('express');
const router = express.Router();

// Tất cả route order đều cần đăng nhập
router.use(auth());

/**
 * POST /api/v1/orders
 * Tạo đơn hàng từ giỏ hàng
 * Body: { shipping_address, payment_method, note }
 */
router.post('/', catchAsync(async (req, res) => {
    const { shipping_address, payment_method, note } = req.body;

    if (!shipping_address) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Vui lòng cung cấp địa chỉ giao hàng.'
        });
    }

    const result = await orderService.createOrderFromCart(req.user._id, {
        shipping_address,
        payment_method,
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
router.get('/my', catchAsync(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);
    res.json({ success: true, data: orders });
}));

module.exports = router;
