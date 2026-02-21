import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Thống kê hệ thống
export const getSystemStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

// Danh mục
export const getCategories = async (search = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/categories`, {
      params: search ? { search } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/categories`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin/categories/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/admin/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
