import axiosClient from './axiosClient';

const checkoutApi = {
    quoteOrder: (data) => axiosClient.post('/orders/quote', data),
    /** POST /api/v1/orders – Tạo đơn từ giỏ hàng */
    placeOrder: (data) => axiosClient.post('/orders', data),

    /** GET /api/v1/orders/my – Lịch sử đơn hàng của tôi */
    getMyOrders: () => axiosClient.get('/orders/my'),

    /** POST /api/v1/orders/:id/cancel – Khách hàng hủy đơn hàng */
    cancelOrder: (orderId) => axiosClient.post(`/orders/${orderId}/cancel`),
};

export default checkoutApi;
