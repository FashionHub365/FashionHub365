import axiosClient from './axiosClient';

const paymentApi = {
    queryVNPayPayment: (transactionId) => axiosClient.get(`/payments/vnpay/query/${transactionId}`),
    getPaymentStatus: (paymentUuid) => axiosClient.get(`/payments/${paymentUuid}/status`),
};

export default paymentApi;
