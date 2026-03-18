import axiosInstance from './axiosClient';

const walletApi = {
    // Get current wallet balance
    getBalance() {
        return axiosInstance.get('/wallet/balance');
    },

    // Get transaction history
    getTransactions(params) {
        return axiosInstance.get('/wallet/transactions', { params });
    },

    // SELLER: Request a payout to bank
    requestPayout(data) {
        return axiosInstance.post('/wallet/payout', data);
    },

    // Get payout history for a store
    getPayouts(storeId, params) {
        return axiosInstance.get(`/wallet/payouts/${storeId}`, { params });
    },

    // ADMIN: Process a payout request (approve/reject)
    processPayout(id, status) {
        return axiosInstance.put(`/wallet/payouts/${id}/process`, { status });
    }
};

export default walletApi;
