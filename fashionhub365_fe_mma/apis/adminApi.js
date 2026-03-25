import axiosClient from './axiosClient';

/**
 * Admin API - Giao tiếp với các endpoint quản trị (/admin/*)
 */
const adminApi = {
    // ... existing stats & logs ...
    getStats: () => axiosClient.get('/admin/stats'),
    getAuditLogs: (params = {}) => axiosClient.get('/admin/audit-logs', { params }),
    getUsers: (params = {}) => axiosClient.get('/admin/users', { params }),
    updateUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }),

    // --- Role Management ---
    getRoleOptions: (params = {}) => axiosClient.get('/admin/roles/options', { params }),
    assignGlobalRole: (userId, data) => axiosClient.post(`/admin/users/${userId}/global-roles`, data),
    revokeGlobalRole: (userId, roleId) => axiosClient.delete(`/admin/users/${userId}/global-roles/${roleId}`),

    // --- Seller Requests ---
    getSellerRequests: (params = {}) => axiosClient.get('/admin/seller-requests', { params }),

    approveSellerRequest: (storeId) => axiosClient.patch(`/admin/seller-requests/${storeId}/approve`),

    rejectSellerRequest: (storeId, data) => axiosClient.patch(`/admin/seller-requests/${storeId}/reject`, data),

    // --- Categories ---
    getCategoryOptions: (params = {}) => axiosClient.get('/admin/categories/options', { params }),
    createCategory: (data) => axiosClient.post('/admin/categories', data),
    updateCategory: (id, data) => axiosClient.put(`/admin/categories/${id}`, data),
    deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`),

    // --- Brands ---
    getBrands: (params = {}) => axiosClient.get('/admin/brands', { params }),
    createBrand: (data) => axiosClient.post('/admin/brands', data),
    updateBrand: (id, data) => axiosClient.put(`/admin/brands/${id}`, data),
    deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`),

    // --- Tags ---
    getTags: (params = {}) => axiosClient.get('/admin/tags', { params }),
    createTag: (data) => axiosClient.post('/admin/tags', data),
    deleteTag: (id) => axiosClient.delete(`/admin/tags/${id}`),

    // --- Collections ---
    getCollections: (params = {}) => axiosClient.get('/admin/collections', { params }),
    createCollection: (userId, data) => axiosClient.post('/admin/collections', data),
    updateCollection: (id, data) => axiosClient.put(`/admin/collections/${id}`, data),
    deleteCollection: (id) => axiosClient.delete(`/admin/collections/${id}`),

    // --- Roles & Permissions ---
    getRoles: (params = {}) => axiosClient.get('/admin/roles', { params }),
    getPermissions: (params = {}) => axiosClient.get('/admin/permissions', { params }),
    getGroupedPermissions: () => axiosClient.get('/admin/permissions/grouped'),

    // --- Products (Admin View) ---
    getAdminProducts: (params = {}) => axiosClient.get('/listing/products', { params: { ...params, adminMode: true } }), // Using listing for now, but adding adminMode flag
};

export default adminApi;
