const httpStatus = require('http-status');
const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a notification
 */
const createNotification = async (data) => {
    return Notification.create(data);
};

/**
 * Create notification for multiple users
 */
const createBulkNotifications = async (userIds, type, message) => {
    const notifications = userIds.map(user_id => ({
        user_id,
        type,
        message,
    }));
    return Notification.insertMany(notifications);
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, query = {}) => {
    const { page = 1, limit = 20, is_read } = query;
    const skip = (page - 1) * limit;

    const filter = { user_id: userId };
    if (is_read !== undefined) {
        filter.is_read = is_read === 'true' || is_read === true;
    }

    const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user_id: userId, is_read: false }),
    ]);

    return {
        items,
        unreadCount,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { $set: { is_read: true } },
        { new: true }
    );
    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }
    return notification;
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { user_id: userId, is_read: false },
        { $set: { is_read: true } }
    );
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
    const result = await Notification.findOneAndDelete({ _id: notificationId, user_id: userId });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ user_id: userId, is_read: false });
};

module.exports = {
    createNotification,
    createBulkNotifications,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
};
