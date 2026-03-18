import axiosInstance from './axiosClient';

const referralApi = {
    // USER: Generate or get existing referral code
    generateCode() {
        return axiosInstance.get('/referrals/code');
    },

    // USER: Apply a referral code (new user signup)
    applyReferral(code) {
        return axiosInstance.post('/referrals/apply', { code });
    },

    // USER: Get referral stats
    getStats() {
        return axiosInstance.get('/referrals/stats');
    },

    // USER: Get referral history
    getHistory(params) {
        return axiosInstance.get('/referrals/history', { params });
    }
};

export default referralApi;
