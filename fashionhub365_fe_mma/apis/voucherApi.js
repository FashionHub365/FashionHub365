import axiosClient from './axiosClient';

/**
 * Voucher API - Seller specific management
 */
const voucherApi = {
    /**
     * Get all vouchers for the current seller's store
     */
    getSellerVouchers: () => {
        return axiosClient.get('/vouchers/seller');
    },

    /**
     * Get a single voucher by ID
     */
    getVoucherById: (id) => {
        return axiosClient.get(`/vouchers/${id}`);
    },

    /**
     * Create a new voucher for the store
     * @param {Object} data - { name, code, discount_type, discount_value, min_order_value, max_discount, start_at, ends_at, usage_limit, is_public }
     */
    createVoucher: (data) => {
        return axiosClient.post('/vouchers/seller', data);
    },

    /**
     * Update an existing voucher
     * @param {string} id 
     * @param {Object} data 
     */
    updateVoucher: (id, data) => {
        return axiosClient.put(`/vouchers/seller/${id}`, data);
    },

    /**
     * Delete a voucher
     * @param {string} id 
     */
    deleteVoucher: (id) => {
        return axiosClient.delete(`/vouchers/seller/${id}`);
    }
};

export default voucherApi;
