const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
// Giả sử bạn đã có middleware xác thực (auth)
// const auth = require('../middleware/auth');

// Lấy lịch sử đơn hàng của Seller (UC-33 & 35)
router.get("/seller/history", orderController.getSellerOrderHistory);

// Xác nhận đơn hàng (UC-29)
router.post("/:id/confirm", orderController.confirmOrder);

// Hủy đơn hàng (UC-30)
router.post("/:id/cancel", orderController.cancelOrder);

// Cập nhật trạng thái giao hàng (UC-32)
router.patch("/:id/status", orderController.updateOrderStatus);

module.exports = router;
