import axiosClient from './axiosClient';

const storeApi = {
    listStores: (params = {}) => axiosClient.get('/stores', { params }),
    getStoreDetail: (storeId) => axiosClient.get(`/stores/${storeId}`),
    createStore: (data) => axiosClient.post('/stores', data),
    updateStore: (storeId, data) => axiosClient.put(`/stores/${storeId}`, data),
    getMyStore: () => axiosClient.get('/stores/me'),
};

export default storeApi;
