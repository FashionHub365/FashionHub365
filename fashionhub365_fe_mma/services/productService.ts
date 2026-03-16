import axiosClient from '../apis/axiosClient';

export const getSellerProducts = async (params = {}) => {
  try {
    const response = await axiosClient.get('/products/seller', { params });
    return response;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

export const getProductById = async (id: string) => {
  try {
    const response = await axiosClient.get(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const createProduct = async (data: any) => {
  try {
    const response = await axiosClient.post('/products', data);
    return response;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, data: any) => {
  try {
    const response = await axiosClient.put(`/products/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const response = await axiosClient.delete(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const toggleStockStatus = async (id: string) => {
  try {
    const response = await axiosClient.patch(`/products/${id}/stock-status`);
    return response;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    throw error;
  }
};

export const getCategories = async () => {
    try {
      const response = await axiosClient.get('/listing/categories');
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
};

export const getProductReviews = async (productId: string, includeHidden = false) => {
    try {
        const response = await axiosClient.get(`/products/${productId}/reviews`, {
            params: { includeHidden }
        });
        return response;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
};
