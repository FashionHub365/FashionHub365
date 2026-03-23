import axiosClient from './axiosClient';

const checkoutApi = {
    /** POST /api/v1/orders – Tạo đơn từ giỏ hàng */
    placeOrder: (data) => axiosClient.post('/orders', data),

    /** GET /api/v1/orders/my – Lịch sử đơn hàng của tôi */
    getMyOrders: (params = {}) => axiosClient.get('/orders/my', { params }),

    /** GET /api/v1/orders/:id - Chi tiết một đơn hàng */
    getOrderById: (orderId) => axiosClient.get(`/orders/${orderId}`),

    /** POST /api/v1/orders/:id/cancel – Huỷ đơn hàng */
    cancelOrder: (orderId) => axiosClient.post(`/orders/${orderId}/cancel`),
};

export default checkoutApi;
