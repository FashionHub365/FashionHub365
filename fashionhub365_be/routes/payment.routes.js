const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Lấy danh sách phương thức thanh toán (UC-36)
router.get("/methods", paymentController.getPaymentMethods);

// Thực hiện thanh toán (UC-37)
router.post("/process", paymentController.processPayment);

// Xem lịch sử thanh toán (UC-38)
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
