const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { storeAuth } = require('../middleware/storeAuth');
const voucherController = require('../controllers/voucher.controller');

const router = express.Router();

// Public: get active vouchers (auth optional to show isClaimed status)
router.get('/active', (req, res, next) => auth(true)(req, res, next), voucherController.getVouchers);

// Authenticated: voucher claiming and wallet
router.post('/claim/:id', auth(), voucherController.claimVoucher);
router.get('/my-vouchers', auth(), voucherController.getMyVouchers);

// Authenticated: apply voucher at checkout
router.post('/apply', auth(), voucherController.applyVoucher);

// Seller: CRUD vouchers (auto-attach store_id)
router.get('/seller', auth(), storeAuth(), voucherController.getSellerVouchers);
router.post('/seller', auth(), storeAuth(), voucherController.createSellerVoucher);
router.put('/seller/:id', auth(), storeAuth(), voucherController.updateSellerVoucher);
router.delete('/seller/:id', auth(), storeAuth(), voucherController.deleteVoucher);

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
