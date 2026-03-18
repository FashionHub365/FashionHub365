const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const notificationService = require('../services/notification.service');

const getNotifications = catchAsync(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    res.status(httpStatus.OK).send({ success: true, data: result });
});

const getUnreadCount = catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.status(httpStatus.OK).send({ success: true, data: { count } });
});

const markAsRead = catchAsync(async (req, res) => {
    await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(httpStatus.OK).send({ success: true, message: 'Notification marked as read' });
});

const markAllAsRead = catchAsync(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);
    res.status(httpStatus.OK).send({ success: true, message: 'All notifications marked as read' });
});

const deleteNotification = catchAsync(async (req, res) => {
    await notificationService.deleteNotification(req.params.id, req.user._id);
    res.status(httpStatus.OK).send({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
