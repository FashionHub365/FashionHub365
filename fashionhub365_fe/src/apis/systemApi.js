import axiosInstance from './axiosClient';

const systemApi = {
    // ---- Settings ----
    getSettings() {
        return axiosInstance.get('/system/settings');
    },
    upsertSetting(data) {
        return axiosInstance.post('/system/settings', data);
    },
    deleteSetting(key) {
        return axiosInstance.delete(`/system/settings/${key}`);
    },

    // ---- Feature Flags ----
    getFlags() {
        return axiosInstance.get('/system/flags');
    },
    upsertFlag(data) {
        return axiosInstance.post('/system/flags', data);
    },
    deleteFlag(key) {
        return axiosInstance.delete(`/system/flags/${key}`);
    },

    // ---- Activity Logs ----
    getActivityLogs(params) {
        return axiosInstance.get('/system/activity-logs', { params });
    }
};

export default systemApi;
