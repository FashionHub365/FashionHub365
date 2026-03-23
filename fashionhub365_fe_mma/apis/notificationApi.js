import axiosClient from './axiosClient';

const notificationApi = {
    /** GET /notifications – Lấy danh sách thông báo (phân trang) */
    getNotifications: (params = {}) => axiosClient.get('/notifications', { params }),

    /** GET /notifications/unread-count – Lấy số lượng thông báo chưa đọc */
    getUnreadCount: () => axiosClient.get('/notifications/unread-count'),

    /** PUT /notifications/read-all – Đánh dấu tất cả là đã đọc */
    markAllAsRead: () => axiosClient.put('/notifications/read-all'),

    /** PUT /notifications/:id/read – Đánh dấu một thông báo là đã đọc */
    markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),

    /** DELETE /notifications/:id – Xóa một thông báo */
    deleteNotification: (id) => axiosClient.delete(`/notifications/${id}`),
};

export default notificationApi;
