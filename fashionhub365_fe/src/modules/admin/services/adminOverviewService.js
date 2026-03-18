import axiosClient from "../../../apis/axiosClient";

const extractMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  "Unknown error";

const extractStatus = (error) => error?.response?.status || null;

const toApiError = (error) => {
  const nextError = new Error(extractMessage(error));
  nextError.status = extractStatus(error);
  return nextError;
};

const normalizeSortOrder = (value) => {
  const lower = String(value || "").toLowerCase();
  return lower === "asc" ? "asc" : "desc";
};

const mapUserFilters = (params = {}) => {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };

  if (params.status) query.status = params.status;
  if (params.search) query.search = params.search;
  if (params.email && !query.search) query.search = params.email;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.order) query.order = normalizeSortOrder(params.order);
  if (params.createdFrom) query.createdFrom = params.createdFrom;
  if (params.createdTo) query.createdTo = params.createdTo;

  return query;
};

const normalizeRoles = (response) => {
  const roles = response?.data?.roles;
  return Array.isArray(roles) ? roles : [];
};

const normalizePermissions = (response) => {
  const permissions = response?.data?.permissions;
  return Array.isArray(permissions) ? permissions : [];
};

export const adminOverviewService = {
  async getSellerRequests(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };
      if (params.status) query.status = params.status;
      if (params.search) query.search = params.search;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.order) query.order = normalizeSortOrder(params.order);

      const response = await axiosClient.get("/admin/seller-requests", { params: query });
      return {
        sellerRequests: Array.isArray(response?.data?.sellerRequests) ? response.data.sellerRequests : [],
        meta: response?.meta || null,
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async approveSellerRequest(storeId) {
    try {
      const response = await axiosClient.patch(`/admin/seller-requests/${storeId}/approve`);
      return response?.data?.store || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getSystemStats() {
    try {
      const response = await axiosClient.get("/admin/stats");
      const payload = response?.data || response || {};
      return {
        summary: payload?.summary || {},
        ordersByStatus: Array.isArray(payload?.ordersByStatus) ? payload.ordersByStatus : [],
        monthlyStats: Array.isArray(payload?.monthlyStats) ? payload.monthlyStats : [],
        monthlyUsers: Array.isArray(payload?.monthlyUsers) ? payload.monthlyUsers : [],
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getUsers(params = { page: 1, limit: 10 }) {
    try {
      const response = await axiosClient.get("/admin/users", { params: mapUserFilters(params) });
      return {
        users: Array.isArray(response?.data?.users) ? response.data.users : [],
        meta: response?.meta || null,
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getUserById(userId) {
    try {
      const response = await axiosClient.get(`/admin/users/${userId}`);
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createUser(payload) {
    try {
      const response = await axiosClient.post("/admin/users", payload);
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateUser(userId, payload) {
    try {
      const response = await axiosClient.put(`/admin/users/${userId}`, payload);
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteUser(userId) {
    try {
      await axiosClient.delete(`/admin/users/${userId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateUserStatus(userId, status, reason = "") {
    try {
      const response = await axiosClient.patch(`/admin/users/${userId}/status`, { status, reason });
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async assignGlobalRoles(userId, roleIds) {
    try {
      const response = await axiosClient.post(`/admin/users/${userId}/global-roles`, { roleIds });
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async revokeGlobalRole(userId, roleId) {
    try {
      await axiosClient.delete(`/admin/users/${userId}/global-roles/${roleId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getUserRoles(userId) {
    try {
      const response = await axiosClient.get(`/admin/users/${userId}/roles`);
      return {
        globalRoles: Array.isArray(response?.data?.globalRoles) ? response.data.globalRoles : [],
        storeRoles: Array.isArray(response?.data?.storeRoles) ? response.data.storeRoles : [],
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getUserDirectPermissions(userId) {
    try {
      const response = await axiosClient.get(`/admin/users/${userId}/direct-permissions`);
      return {
        directPermissions: Array.isArray(response?.data?.directPermissions) ? response.data.directPermissions : [],
        allowPermissions: Array.isArray(response?.data?.allowPermissions) ? response.data.allowPermissions : [],
        denyPermissions: Array.isArray(response?.data?.denyPermissions) ? response.data.denyPermissions : [],
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async upsertUserDirectPermission(userId, payload) {
    try {
      const response = await axiosClient.post(`/admin/users/${userId}/direct-permissions`, payload);
      return response?.data?.directPermission || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteUserDirectPermission(userId, permissionId) {
    try {
      await axiosClient.delete(`/admin/users/${userId}/direct-permissions/${permissionId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getUserEffectivePermissions(userId) {
    try {
      const response = await axiosClient.get(`/admin/users/${userId}/effective-permissions`);
      return {
        rolePermissions: Array.isArray(response?.data?.rolePermissions) ? response.data.rolePermissions : [],
        globalRolePermissions: Array.isArray(response?.data?.globalRolePermissions) ? response.data.globalRolePermissions : [],
        storeRolePermissions: Array.isArray(response?.data?.storeRolePermissions) ? response.data.storeRolePermissions : [],
        directAllowPermissions: Array.isArray(response?.data?.directAllowPermissions) ? response.data.directAllowPermissions : [],
        directDenyPermissions: Array.isArray(response?.data?.directDenyPermissions) ? response.data.directDenyPermissions : [],
        effectivePermissions: Array.isArray(response?.data?.effectivePermissions) ? response.data.effectivePermissions : [],
        directPermissions: Array.isArray(response?.data?.directPermissions) ? response.data.directPermissions : [],
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async assignStoreRoles(userId, storeId, roleIds) {
    try {
      const response = await axiosClient.post(`/admin/users/${userId}/store-roles`, {
        storeId,
        roleIds,
      });
      return response?.data?.member || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async revokeStoreRole(userId, roleId, storeId) {
    try {
      const config = storeId
        ? { params: { storeId } }
        : undefined;
      await axiosClient.delete(`/admin/users/${userId}/store-roles/${roleId}`, config);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getStores(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
      };
      if (params.search) query.search = params.search;
      if (params.sort) query.sort = params.sort;

      const response = await axiosClient.get("/stores", { params: query });
      const payload = response?.data || {};
      const pagination = payload?.pagination || {};
      return {
        stores: Array.isArray(payload?.stores) ? payload.stores : [],
        pagination: {
          page: Number(pagination.page || query.page),
          limit: Number(pagination.limit || query.limit),
          totalItems: Number(pagination.totalItems || 0),
          totalPages: Number(pagination.totalPages || 1),
        },
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getRoles(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
      };
      if (params.search) query.search = params.search;
      if (params.scope) query.scope = params.scope;
      if (params.includeDeleted !== undefined) query.includeDeleted = params.includeDeleted;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.order) query.order = normalizeSortOrder(params.order);

      const response = await axiosClient.get("/admin/roles", { params: query });
      return normalizeRoles(response);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getRoleOptions() {
    try {
      const response = await axiosClient.get("/admin/roles/options");
      const roles = response?.data?.roles;
      return Array.isArray(roles) ? roles : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createRole(payload) {
    try {
      const response = await axiosClient.post("/admin/roles", payload);
      return response?.data?.role || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateRole(roleId, payload) {
    try {
      const response = await axiosClient.put(`/admin/roles/${roleId}`, payload);
      return response?.data?.role || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getRolePermissions(roleId) {
    try {
      const response = await axiosClient.get(`/admin/roles/${roleId}/permissions`);
      const permissions = response?.data?.permissions;
      return Array.isArray(permissions) ? permissions : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async replaceRolePermissions(roleId, permissionIds) {
    try {
      const response = await axiosClient.put(`/admin/roles/${roleId}/permissions`, { permissionIds });
      return response?.data?.role || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getPermissions(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 200,
      };
      if (params.search) query.search = params.search;
      if (params.module) query.module = params.module;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.order) query.order = normalizeSortOrder(params.order);

      const response = await axiosClient.get("/admin/permissions", { params: query });
      return normalizePermissions(response);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createPermission(payload) {
    try {
      const response = await axiosClient.post("/admin/permissions", payload);
      return response?.data?.permission || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getGroupedPermissions() {
    try {
      const response = await axiosClient.get("/admin/permissions/grouped");
      const grouped = response?.data?.permissions;
      if (!grouped || typeof grouped !== "object" || Array.isArray(grouped)) {
        return {};
      }
      return grouped;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getCategories(params = {}) {
    try {
      const query = {};
      if (params.search) query.search = params.search;
      if (params.includeDeleted !== undefined) query.includeDeleted = params.includeDeleted;
      const response = await axiosClient.get("/admin/categories", { params: query });
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data?.categories)) return response.data.categories;
      return [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getBrands(params = {}) {
    try {
      const response = await axiosClient.get("/admin/brands", { params });
      return Array.isArray(response?.data?.brands) ? response.data.brands : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createBrand(payload) {
    try {
      const response = await axiosClient.post("/admin/brands", payload);
      return response?.data?.brand || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateBrand(brandId, payload) {
    try {
      const response = await axiosClient.put(`/admin/brands/${brandId}`, payload);
      return response?.data?.brand || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteBrand(brandId) {
    try {
      await axiosClient.delete(`/admin/brands/${brandId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getCollections(params = {}) {
    try {
      const response = await axiosClient.get("/admin/collections", { params });
      return Array.isArray(response?.data?.collections) ? response.data.collections : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createCollection(payload) {
    try {
      const response = await axiosClient.post("/admin/collections", payload);
      return response?.data?.collection || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateCollection(collectionId, payload) {
    try {
      const response = await axiosClient.put(`/admin/collections/${collectionId}`, payload);
      return response?.data?.collection || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteCollection(collectionId) {
    try {
      await axiosClient.delete(`/admin/collections/${collectionId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getTags(params = {}) {
    try {
      const response = await axiosClient.get("/admin/tags", { params });
      return Array.isArray(response?.data?.tags) ? response.data.tags : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createTag(payload) {
    try {
      const response = await axiosClient.post("/admin/tags", payload);
      return response?.data?.tag || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteTag(tagId) {
    try {
      await axiosClient.delete(`/admin/tags/${tagId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAuditLogs(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };
      if (params.userId) query.userId = params.userId;
      if (params.action) query.action = params.action;
      if (params.targetCollection) query.targetCollection = params.targetCollection;
      if (params.targetId) query.targetId = params.targetId;
      if (params.search) query.search = params.search;
      if (params.from) query.from = params.from;
      if (params.to) query.to = params.to;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.order) query.order = normalizeSortOrder(params.order);

      const response = await axiosClient.get("/admin/audit-logs", { params: query });
      return {
        auditLogs: Array.isArray(response?.data?.auditLogs) ? response.data.auditLogs : [],
        meta: response?.meta || null,
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAuditLogById(logId) {
    try {
      const response = await axiosClient.get(`/admin/audit-logs/${logId}`);
      return response?.data?.auditLog || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAdminProfile() {
    try {
      const response = await axiosClient.get("/admin/profile");
      return response?.data?.user || null;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAdminPermissions() {
    try {
      const response = await axiosClient.get("/admin/me/permissions");
      return {
        globalPermissions: Array.isArray(response?.data?.globalPermissions) ? response.data.globalPermissions : [],
        effectivePermissions: Array.isArray(response?.data?.effectivePermissions) ? response.data.effectivePermissions : [],
        stores: Array.isArray(response?.data?.stores) ? response.data.stores : [],
      };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async changeAdminPassword(oldPassword, newPassword) {
    try {
      const response = await axiosClient.post("/admin/change-password", {
        oldPassword,
        newPassword,
      });
      return response?.data || {};
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAdminSessions() {
    try {
      const response = await axiosClient.get("/admin/sessions");
      return Array.isArray(response?.data?.sessions) ? response.data.sessions : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async revokeAdminSession(sessionId) {
    try {
      await axiosClient.delete(`/admin/sessions/${sessionId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async logoutAllAdminSessions() {
    try {
      await axiosClient.post("/admin/logout-all");
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAdminEnums() {
    try {
      const response = await axiosClient.get("/admin/enums");
      return response?.data || {};
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getPublicProducts(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        limit: params.limit ?? 12,
      };
      if (params.search) query.search = params.search;
      if (params.category) query.category = params.category;
      if (params.sort) query.sort = params.sort;
      if (params.storeId) query.storeId = params.storeId;

      const response = await axiosClient.get("/listing/products", { params: query });
      const data = response?.data || {};
      return {
        products: Array.isArray(data.products) ? data.products : [],
        total: Number(data.total || 0),
        page: Number(data.page || query.page),
        limit: Number(data.limit || query.limit),
        totalPages: Number(data.totalPages || 1),
      };
    } catch (error) {
      throw toApiError(error);
    }
  },
};
