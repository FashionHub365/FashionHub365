import axiosInstance from './axiosClient';

const voucherApi = {
    // PUBLIC: Get active vouchers
    getActiveVouchers(params) {
        return axiosInstance.get('/vouchers/active', { params });
    },

    // USER: Apply voucher at checkout
    applyVoucher(code, orderAmount) {
        return axiosInstance.post('/vouchers/apply', { code, orderAmount });
    },

    // ADMIN: Get all vouchers
    getVouchers(params) {
        return axiosInstance.get('/vouchers', { params });
    },

    // ADMIN: Get voucher by ID
    getVoucherById(id) {
        return axiosInstance.get(`/vouchers/${id}`);
    },

    // ADMIN: Create voucher
    createVoucher(data) {
        return axiosInstance.post('/vouchers', data);
    },

    // ADMIN: Update voucher
    updateVoucher(id, data) {
        return axiosInstance.put(`/vouchers/${id}`, data);
    },

    // ADMIN: Delete voucher
    deleteVoucher(id) {
        return axiosInstance.delete(`/vouchers/${id}`);
    },

    // ── SELLER ──────────────────────────────────────

    // SELLER: Get store vouchers
    getSellerVouchers(params) {
        return axiosInstance.get('/vouchers/seller', { params });
    },

    // SELLER: Create store voucher
    createSellerVoucher(data) {
        return axiosInstance.post('/vouchers/seller', data);
    },

    // SELLER: Update store voucher
    updateSellerVoucher(id, data) {
        return axiosInstance.put(`/vouchers/seller/${id}`, data);
    },

    // SELLER: Delete store voucher
    deleteSellerVoucher(id) {
        return axiosInstance.delete(`/vouchers/seller/${id}`);
    }
};

export default voucherApi;
