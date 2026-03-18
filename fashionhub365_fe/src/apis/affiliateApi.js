import axiosInstance from './axiosClient';

const affiliateApi = {
    // PUBLIC: Get available programs
    getPrograms(params) {
        return axiosInstance.get('/affiliates/programs', { params });
    },

    // ADMIN: Create program
    createProgram(data) {
        return axiosInstance.post('/affiliates/programs', data);
    },

    // ADMIN: Update program
    updateProgram(id, data) {
        return axiosInstance.put(`/affiliates/programs/${id}`, data);
    },

    // ADMIN: Delete program
    deleteProgram(id) {
        return axiosInstance.delete(`/affiliates/programs/${id}`);
    },

    // USER: Generate affiliate link for a program
    generateLink(programId) {
        return axiosInstance.post(`/affiliates/links/${programId}`);
    },

    // USER: Get my generated links
    getMyLinks() {
        return axiosInstance.get('/affiliates/links/my');
    },

    // USER: Get my commissions
    getMyCommissions(params) {
        return axiosInstance.get('/affiliates/commissions/my', { params });
    }
};

export default affiliateApi;
