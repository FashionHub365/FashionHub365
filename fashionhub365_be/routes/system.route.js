const express = require('express');
const { auth } = require('../middleware/auth');
const systemController = require('../controllers/system.controller');

const router = express.Router();

// All system routes require admin auth
router.use(auth());

// Settings
router.get('/settings', systemController.getSettings);
router.post('/settings', systemController.upsertSetting);
router.delete('/settings/:key', systemController.deleteSetting);

// Feature Flags
router.get('/flags', systemController.getFlags);
router.post('/flags', systemController.upsertFlag);
router.delete('/flags/:key', systemController.deleteFlag);

// Activity Logs
router.get('/activity-logs', systemController.getActivityLogs);

module.exports = router;
