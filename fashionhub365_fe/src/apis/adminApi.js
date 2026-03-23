import axiosInstance from './axiosClient';

const adminApi = {
    // Stats & System
    getStats: () => axiosInstance.get('/admin/stats'),
    getEnums: () => axiosInstance.get('/admin/enums'),
    getAuditLogs: (params) => axiosInstance.get('/admin/audit-logs', { params }),

    // Users
    getUsers: (params) => axiosInstance.get('/admin/users', { params }),
    createUser: (data) => axiosInstance.post('/admin/users', data),
    getUserById: (id) => axiosInstance.get(`/admin/users/${id}`),
    updateUser: (id, data) => axiosInstance.put(`/admin/users/${id}`, data),
    deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),
    updateUserStatus: (id, status) => axiosInstance.patch(`/admin/users/${id}/status`, { status }),

    // Roles & Permissions
    getRoles: (params) => axiosInstance.get('/admin/roles', { params }),
    getRoleOptions: () => axiosInstance.get('/admin/roles/options'),
    createRole: (data) => axiosInstance.post('/admin/roles', data),
    updateRole: (id, data) => axiosInstance.put(`/admin/roles/${id}`, data),
    deleteRole: (id) => axiosInstance.delete(`/admin/roles/${id}`),
    getRolePermissions: (id) => axiosInstance.get(`/admin/roles/${id}/permissions`),
    updateRolePermissions: (id, permissions) => axiosInstance.put(`/admin/roles/${id}/permissions`, { permissions }),
    getPermissions: (params) => axiosInstance.get('/admin/permissions', { params }),
    getGroupedPermissions: () => axiosInstance.get('/admin/permissions/grouped'),

    // Seller Requests
    getSellerRequests: (params) => axiosInstance.get('/admin/seller-requests', { params }),
    approveSellerRequest: (storeId) => axiosInstance.patch(`/admin/seller-requests/${storeId}/approve`),
    rejectSellerRequest: (storeId, reason) => axiosInstance.patch(`/admin/seller-requests/${storeId}/reject`, { reason }),

    // Categories
    getCategories: (params) => axiosInstance.get('/admin/categories', { params }),
    createCategory: (data) => axiosInstance.post('/admin/categories', data),
    updateCategory: (id, data) => axiosInstance.put(`/admin/categories/${id}`, data),
    deleteCategory: (id) => axiosInstance.delete(`/admin/categories/${id}`),

    // Brands
    getBrands: (params) => axiosInstance.get('/admin/brands', { params }),
    createBrand: (data) => axiosInstance.post('/admin/brands', data),
    updateBrand: (id, data) => axiosInstance.put(`/admin/brands/${id}`, data),
    deleteBrand: (id) => axiosInstance.delete(`/admin/brands/${id}`),

    // Collections
    getCollections: (params) => axiosInstance.get('/admin/collections', { params }),
    createCollection: (data) => axiosInstance.post('/admin/collections', data),
    updateCollection: (id, data) => axiosInstance.put(`/admin/collections/${id}`, data),
    deleteCollection: (id) => axiosInstance.delete(`/admin/collections/${id}`),

    // Tags
    getTags: (params) => axiosInstance.get('/admin/tags', { params }),
    createTag: (data) => axiosInstance.post('/admin/tags', data),
    deleteTag: (id) => axiosInstance.delete(`/admin/tags/${id}`),
};

export default adminApi;
