import axiosClient from './axiosClient';

const inventoryApi = {
    /**
     * Get inventory list for the current store
     * @param {Object} params - { page, limit, productId, location }
     */
    getInventory: (params = {}) => {
        return axiosClient.get('/inventory', { params });
    },

    /**
     * Get single inventory details
     * @param {string} id - Inventory ID
     */
    getInventoryById: (id) => {
        return axiosClient.get(`/inventory/${id}`);
    },

    /**
     * Adjust inventory quantity (increment/decrement)
     * @param {string} id - Inventory ID
     * @param {number} adjustment - The amount to add (positive) or subtract (negative)
     */
    adjustInventory: (id, adjustment) => {
        return axiosClient.patch(`/inventory/${id}`, { adjustment });
    },

    /**
     * Get low stock alerts
     * @param {number} threshold - Stock threshold (default 10)
     */
    getLowStockAlerts: (threshold = 10) => {
        return axiosClient.get('/inventory/low-stock', { params: { threshold } });
    },

    /**
     * Create or update inventory (Direct override)
     * @param {Object} data - { product_id, variant_id, location, quantity }
     */
    upsertInventory: (data) => {
        return axiosClient.post('/inventory', data);
    }
};

export default inventoryApi;
