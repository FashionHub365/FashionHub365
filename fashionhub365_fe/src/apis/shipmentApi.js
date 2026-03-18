import axiosClient from './axiosClient';

const shipmentApi = {
    createShipment: (orderId, providerId, trackingNumber) => {
        return axiosClient.post('/shipments', { orderId, providerId, trackingNumber });
    },
    addEvent: (shipmentId, status, location, note) => {
        return axiosClient.post(`/shipments/${shipmentId}/events`, { status, location, note });
    },
    getTracking: (orderId) => {
        return axiosClient.get(`/shipments/tracking/${orderId}`);
    },
    getProviders: () => {
        return axiosClient.get('/shipments/providers');
    },
};

export default shipmentApi;
