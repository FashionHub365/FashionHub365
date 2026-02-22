import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// UC-16: Lấy danh sách sản phẩm của seller
export const getSellerProducts = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/seller`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

// UC-16: Lấy chi tiết 1 sản phẩm
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// UC-16: Cập nhật sản phẩm
export const updateProduct = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// UC-16: Xóa sản phẩm
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// UC-16: Bật/tắt trạng thái hết hàng
export const toggleStockStatus = async (id) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/products/${id}/stock-status`);
    return response.data;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    throw error;
  }
};
