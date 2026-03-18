const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const walletController = require('../controllers/wallet.controller');

const router = express.Router();

router.use(auth());

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/payout', authorize(['PAYOUT.REQUEST']), walletController.requestPayout);
router.get('/payouts/:storeId', authorize(['PAYOUT.VIEW']), walletController.getPayouts);

// Admin-only (Finance/Super Admin)
router.put('/payouts/:id/process', authorize(['PAYOUT.PROCESS']), walletController.processPayout);

module.exports = router;
