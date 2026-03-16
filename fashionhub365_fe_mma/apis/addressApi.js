import axiosClient from './axiosClient';

const addressApi = {
    getAddresses: () => axiosClient.get('/users/addresses'),
    getAddress: (uuid) => axiosClient.get(`/users/addresses/${uuid}`),
    createAddress: (data) => axiosClient.post('/users/addresses', data),
    updateAddress: (uuid, data) => axiosClient.put(`/users/addresses/${uuid}`, data),
    deleteAddress: (uuid) => axiosClient.delete(`/users/addresses/${uuid}`),
    setDefaultAddress: (uuid) => axiosClient.put(`/users/addresses/${uuid}/default`),
};

export default addressApi;
