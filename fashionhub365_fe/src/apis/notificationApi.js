import axiosInstance from './axiosClient';

const notificationApi = {
    // Get user notifications
    getNotifications(params) {
        return axiosInstance.get('/notifications', { params });
    },

    // Get count of unread notifications
    getUnreadCount(params) {
        return axiosInstance.get('/notifications/unread-count', { params });
    },

    // Mark single notification as read
    markAsRead(id) {
        return axiosInstance.put(`/notifications/${id}/read`);
    },

    // Mark all notifications as read
    markAllAsRead(params) {
        return axiosInstance.put('/notifications/read-all', null, { params });
    },

    // Delete a notification
    deleteNotification(id) {
        return axiosInstance.delete(`/notifications/${id}`);
    }
};

export default notificationApi;
