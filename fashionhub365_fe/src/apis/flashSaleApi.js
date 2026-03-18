import axiosInstance from './axiosClient';

const flashSaleApi = {
    // PUBLIC: Get active flash sales
    getActiveFlashSales(params) {
        return axiosInstance.get('/flash-sales/active', { params });
    },

    // ADMIN: Get all flash sales
    getFlashSales(params) {
        return axiosInstance.get('/flash-sales', { params });
    },

    // ADMIN: Get flash sale by ID
    getFlashSaleById(id) {
        return axiosInstance.get(`/flash-sales/${id}`);
    },

    // ADMIN: Create flash sale
    createFlashSale(data) {
        return axiosInstance.post('/flash-sales', data);
    },

    // ADMIN: Update flash sale
    updateFlashSale(id, data) {
        return axiosInstance.put(`/flash-sales/${id}`, data);
    },

    // ADMIN: Delete flash sale
    deleteFlashSale(id) {
        return axiosInstance.delete(`/flash-sales/${id}`);
    }
};

export default flashSaleApi;
