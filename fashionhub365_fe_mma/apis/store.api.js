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
    getMyStore: () => {
        return axiosClient.get('/stores/me');
    },
};


export default storeApi;
