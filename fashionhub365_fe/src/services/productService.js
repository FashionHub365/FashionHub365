import axiosClient from '../apis/axiosClient';

// UC-16: Lấy danh sách sản phẩm của seller
export const getSellerProducts = async (params = {}) => {
  try {
    const response = await axiosClient.get(`/products/seller`, { params });
    return response;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

// UC-16: Lấy chi tiết 1 sản phẩm
export const getProductById = async (id) => {
  try {
    const response = await axiosClient.get(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// UC-16: Cập nhật sản phẩm
export const updateProduct = async (id, data) => {
  try {
    const response = await axiosClient.put(`/products/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// UC-16: Xóa sản phẩm
export const deleteProduct = async (id) => {
  try {
    const response = await axiosClient.delete(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// UC-16: Bật/tắt trạng thái hết hàng
export const toggleStockStatus = async (id) => {
  try {
    const response = await axiosClient.patch(`/products/${id}/stock-status`);
    return response;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    throw error;
  }
};
