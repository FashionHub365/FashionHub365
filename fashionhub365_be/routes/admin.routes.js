const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// Thống kê hệ thống (UC-50)
router.get("/stats", adminController.getSystemStats);

module.exports = router;
