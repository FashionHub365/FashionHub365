import adminApi from '../apis/adminApi';

// Thống kê hệ thống
export const getSystemStats = async () => {
  try {
    const response = await adminApi.getStats();
    return response;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

// Danh mục
export const getCategories = async (search = '') => {
  try {
    const response = await adminApi.getCategories({ search });
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (data) => {
  try {
    const response = await adminApi.createCategory(data);
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  try {
    const response = await adminApi.updateCategory(id, data);
    return response;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await adminApi.deleteCategory(id);
    return response;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const getBrands = (params) => adminApi.getBrands(params);
export const createBrand = (data) => adminApi.createBrand(data);
export const updateBrand = (id, data) => adminApi.updateBrand(id, data);
export const deleteBrand = (id) => adminApi.deleteBrand(id);

export const getCollections = (params) => adminApi.getCollections(params);
export const createCollection = (data) => adminApi.createCollection(data);
export const updateCollection = (id, data) => adminApi.updateCollection(id, data);
export const deleteCollection = (id) => adminApi.deleteCollection(id);

export const getTags = (params) => adminApi.getTags(params);
export const createTag = (data) => adminApi.createTag(data);
export const deleteTag = (id) => adminApi.deleteTag(id);

export const getRoles = (params) => adminApi.getRoles(params);
export const createRole = (data) => adminApi.createRole(data);
export const updateRole = (id, data) => adminApi.updateRole(id, data);
export const deleteRole = (id) => adminApi.deleteRole(id);
export const getRolePermissions = (id) => adminApi.getRolePermissions(id);
export const updateRolePermissions = (id, perms) => adminApi.updateRolePermissions(id, perms);

export { adminApi };