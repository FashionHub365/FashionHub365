import axiosClient from '../apis/axiosClient';

// System Stats
export const getSystemStats = async () => {
  try {
    const response = await axiosClient.get('/admin/stats');
    return response;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

// Categories
export const getCategories = async (search = '') => {
  try {
    const response = await axiosClient.get('/admin/categories', {
      params: search ? { search } : {}
    });
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (data: any) => {
  try {
    const response = await axiosClient.post('/admin/categories', data);
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: any) => {
  try {
    const response = await axiosClient.put(`/admin/categories/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await axiosClient.delete(`/admin/categories/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
