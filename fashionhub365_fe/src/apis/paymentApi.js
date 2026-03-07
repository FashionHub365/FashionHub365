import axiosClient from './axiosClient';

const paymentApi = {
    createVNPayPayment: (payload) => axiosClient.post('/payments/vnpay/create', payload),
    queryVNPayPayment: (transactionId) => axiosClient.get(`/payments/vnpay/query/${transactionId}`),
    getPaymentStatus: (paymentUuid) => axiosClient.get(`/payments/${paymentUuid}/status`),
};

export default paymentApi;
