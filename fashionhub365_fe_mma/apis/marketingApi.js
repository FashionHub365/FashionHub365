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
    },

    /**
     * Lấy danh sách Voucher (có thể lọc theo store, product)
     * @param {object} params 
     */
    getVouchers: (params) => {
        return axiosClient.get('/vouchers/active', { params });
    },

    /**
     * Lấy danh sách Voucher của tôi
     */
    getMyVouchers: () => {
        return axiosClient.get('/vouchers/my-vouchers');
    },

    /**
     * Thu thập Voucher vào ví
     * @param {string} id 
     */
    claimVoucher: (id) => {
        return axiosClient.post(`/vouchers/claim/${id}`);
    }
};

export default marketingApi;
