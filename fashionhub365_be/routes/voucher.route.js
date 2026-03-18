const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const voucherController = require('../controllers/voucher.controller');

const router = express.Router();

// Public: get active vouchers
router.get('/active', voucherController.getVouchers);

// Authenticated: apply voucher at checkout
router.post('/apply', auth(), voucherController.applyVoucher);

// Admin: CRUD vouchers
router.use(auth());
router
    .route('/')
    .get(voucherController.getVouchers)
    .post(voucherController.createVoucher);

router
    .route('/:id')
    .get(voucherController.getVoucherById)
    .put(voucherController.updateVoucher)
    .delete(voucherController.deleteVoucher);

module.exports = router;
