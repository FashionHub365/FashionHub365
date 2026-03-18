const express = require('express');
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// All notification routes require authentication
router.use(auth());

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
