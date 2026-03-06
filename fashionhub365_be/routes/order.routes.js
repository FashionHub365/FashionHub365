const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const auth = require("../middleware/auth");
const { storeAuth } = require("../middleware/storeAuth");

// Lấy thống kê cho Seller Dashboard (UC-50)
router.get("/stats", auth.auth(), storeAuth(), orderController.getStoreStats);

// Lấy lịch sử đơn hàng của Seller (UC-33 & 35)
router.get("/seller/history", auth.auth(), storeAuth(), orderController.getSellerOrderHistory);

// Xác nhận đơn hàng (UC-29)
router.post("/:id/confirm", auth.auth(), storeAuth(), orderController.confirmOrder);

// Hủy đơn hàng (UC-30)
router.post("/:id/cancel", auth.auth(), storeAuth(), orderController.cancelOrder);

// Cập nhật trạng thái giao hàng (UC-32)
router.patch("/:id/status", auth.auth(), storeAuth(), orderController.updateOrderStatus);

module.exports = router;
