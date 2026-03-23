const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const voucherController = require('../controllers/voucher.controller');

const router = express.Router();

// Public: get active vouchers (auth optional to show isClaimed status)
router.get('/active', (req, res, next) => auth(true)(req, res, next), voucherController.getVouchers);

// Authenticated: voucher claiming and wallet
router.post('/claim/:id', auth(), voucherController.claimVoucher);
router.get('/my-vouchers', auth(), voucherController.getMyVouchers);

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
