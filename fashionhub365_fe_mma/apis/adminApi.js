import axiosClient from './axiosClient';

/**
 * Admin API - Giao tiếp với các endpoint quản trị (/admin/*)
 */
const adminApi = {
    /**
     * Lấy thống kê hệ thống (Doanh thu, Người dùng, Đơn hàng...)
     * GET /admin/stats
     */
    getStats: () => {
        return axiosClient.get('/admin/stats');
    },

    /**
     * Lấy danh sách nhật ký hệ thống
     * GET /admin/audit-logs
     */
    getAuditLogs: (params = {}) => {
        return axiosClient.get('/admin/audit-logs', { params });
    },

    /**
     * Lấy danh sách người dùng trên hệ thống
     * GET /admin/users
     */
    getUsers: (params = {}) => {
        return axiosClient.get('/admin/users', { params });
    },

    /**
     * Lấy danh sách yêu cầu mở cửa hàng (Seller Requests)
     * GET /admin/seller-requests
     */
    getSellerRequests: (params = {}) => {
        return axiosClient.get('/admin/seller-requests', { params });
    },

    /**
     * Lấy các tùy chọn danh mục (bao gồm cả đã xóa)
     * GET /admin/categories/options
     */
    getCategoryOptions: (params = {}) => {
        return axiosClient.get('/admin/categories/options', { params });
    }
};

export default adminApi;
