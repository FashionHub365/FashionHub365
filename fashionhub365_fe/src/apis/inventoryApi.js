import axiosInstance from './axiosClient';

const inventoryApi = {
    // Get inventory by store (for sellers)
    getInventory(params) {
        return axiosInstance.get('/inventory', { params });
    },

    // Get specific inventory item
    getInventoryById(id) {
        return axiosInstance.get(`/inventory/${id}`);
    },

    // Create or update inventory
    upsertInventory(data) {
        return axiosInstance.post('/inventory', data);
    },

    // Adjust inventory (+ or -)
    adjustInventory(id, adjustment) {
        return axiosInstance.patch(`/inventory/${id}`, { adjustment });
    },

    // Get products with low stock for current store
    getLowStockAlerts(threshold = 10) {
        return axiosInstance.get('/inventory/low-stock', { params: { threshold } });
    }
};

export default inventoryApi;
