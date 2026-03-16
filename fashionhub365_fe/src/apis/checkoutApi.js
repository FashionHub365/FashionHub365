import axiosClient from './axiosClient';

const checkoutApi = {
    /** POST /api/v1/orders – Tạo đơn từ giỏ hàng */
    placeOrder: (data) => axiosClient.post('/orders', data),

    /** GET /api/v1/orders/my – Lịch sử đơn hàng của tôi */
    getMyOrders: () => axiosClient.get('/orders/my'),
};

export default checkoutApi;
