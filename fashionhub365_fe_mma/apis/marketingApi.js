import axiosClient from './axiosClient';

/**
 * Marketing API - Giao tiếp với backend cho Campaign, Flash Sale, Voucher
 */
const marketingApi = {
    /**
     * Lấy các chương trình Flash Sale đang diễn ra
     * @returns {Promise} 
     */
    getActiveFlashSales: () => {
        return axiosClient.get('/flash-sales/active');
    },

    /**
     * Lấy chi tiết một chương trình Flash Sale
     * @param {string} id 
     */
    getFlashSaleDetail: (id) => {
        return axiosClient.get(`/flash-sales/${id}`);
    }
};

export default marketingApi;
