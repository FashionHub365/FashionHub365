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

    /** POST /listing/products/:id/view - Tăng lượt xem (không yêu cầu auth) */
    trackProductView: (id) => {
        return axiosClient.post(`/listing/products/${id}/view`);
    },

    /** GET /listing/products/:id/reviews - Lấy review của sản phẩm */
    getProductReviews: (id, params = {}) => {
        return axiosClient.get(`/listing/products/${id}/reviews`, { params });
    },

    /** POST /listing/products/:id/reviews - Thêm review (yêu cầu bộ token auth, axios interceptor sẽ lo) */
    createProductReview: (id, data) => {
        return axiosClient.post(`/listing/products/${id}/reviews`, data);
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

    /**
     * Tăng view_count khi user xem Product Detail
     * Fire-and-forget: gọi nhưng không cần đợi kết quả
     * @param {string} productId
     */
    trackView: (productId) => {
        return axiosClient.post(`/listing/products/${productId}/view`);
    },

    /**
     * Lấy danh sách reviews sản phẩm
     * @param {string} productId 
     */
    getProductReviews: (productId) => {
        return axiosClient.get(`/listing/products/${productId}/reviews`);
    },

    /**
     * Đăng review mới cho sản phẩm
     * @param {string} productId 
     * @param {Object} reviewData 
     */
    createProductReview: (productId, reviewData) => {
        return axiosClient.post(`/listing/products/${productId}/reviews`, reviewData);
    },
    /**
     * Lấy thông tin chi tiết 1 cửa hàng theo ID
     * @param {string} storeId 
     */
    getStoreById: (storeId) => {
        return axiosClient.get(`/listing/stores/${storeId}`);
    },
};

export default listingApi;
