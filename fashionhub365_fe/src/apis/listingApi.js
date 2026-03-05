import axiosClient from './axiosClient';

/**
 * Listing API - Giao tiếp với backend cho trang Listing & Product Detail
 * Tuân theo pattern axiosClient của nhóm
 */
const listingApi = {
    /**
     * Lấy danh sách sản phẩm công khai
     * @param {Object} params - { category, color, size, search, sort, page, limit }
     */
    getProducts: (params = {}) => {
        return axiosClient.get('/listing/products', { params });
    },

    /**
     * Lấy chi tiết 1 sản phẩm theo ID
     * @param {string} id - Product ID
     */
    getProductById: (id) => {
        return axiosClient.get(`/listing/products/${id}`);
    },

    /**
     * Lấy sản phẩm gợi ý (cùng category, loại trừ SP hiện tại)
     * @param {string} id - Product ID hiện tại
     * @param {number} limit
     */
    getRecommendedProducts: (id, limit = 4) => {
        return axiosClient.get(`/listing/products/${id}/recommended`, { params: { limit } });
    },

    /**
     * Lấy danh sách danh mục để hiển thị trong filter
     */
    getCategories: () => {
        return axiosClient.get('/listing/categories');
    },
};

export default listingApi;
