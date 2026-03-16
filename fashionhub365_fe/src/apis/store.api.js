import axiosClient from './axiosClient';

const storeApi = {
    followStore: (storeId) => {
        return axiosClient.post(`/stores/${storeId}/follow`);
    },
    unfollowStore: (storeId) => {
        return axiosClient.post(`/stores/${storeId}/unfollow`);
    },
    getFollowingStatus: (storeId) => {
        return axiosClient.get(`/stores/${storeId}/following-status`);
    },
    getFollowerCount: (storeId) => {
        return axiosClient.get(`/stores/${storeId}/follower-count`);
    },
    getFollowingStores: (page = 1, limit = 6) => {
        return axiosClient.get(`/stores/following?page=${page}&limit=${limit}`);
    },
    listStores: (params = {}) => axiosClient.get('/stores', { params }),
    getStoreDetail: (storeId) => axiosClient.get(`/stores/${storeId}`),
    createStore: (data) => axiosClient.post('/stores', data),
    updateStore: (storeId, data) => axiosClient.put(`/stores/${storeId}`, data),
};


export default storeApi;
