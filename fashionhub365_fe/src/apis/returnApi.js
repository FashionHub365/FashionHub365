import axiosClient from './axiosClient';

const returnApi = {
    requestReturn: (orderId, reason) => {
        return axiosClient.post('/returns/request', { orderId, reason });
    },
    getMyReturns: () => {
        return axiosClient.get('/returns/my-returns');
    },
    getStoreReturns: (storeId) => {
        return axiosClient.get(`/returns/store/${storeId}`);
    },
    processReturn: (returnId, action, note) => {
        return axiosClient.patch(`/returns/${returnId}/process`, { action, note });
    },
};

export default returnApi;
