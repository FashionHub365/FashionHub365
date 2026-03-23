import axiosClient from './axiosClient';

const authApi = {
    register: (data) => {
        return axiosClient.post('/auth/register', data);
    },
    login: (data) => {
        return axiosClient.post('/auth/login', data);
    },
    verifyOtp: (data) => {
        return axiosClient.post('/auth/verify-otp', data);
    },
    googleLogin: (payload) => {
        return axiosClient.post('/auth/google', payload);
    },
    logout: () => {
        return axiosClient.post('/auth/logout', {});
    },
    forgotPassword: (email) => {
        return axiosClient.post('/auth/forgot-password', { email });
    },
    resetPassword: (data) => {
        // data should be { token, newPassword }
        return axiosClient.post('/auth/reset-password', data);
    },
    getMe: () => {
        return axiosClient.get('/auth/me');
    },
    changePassword: (data) => {
        return axiosClient.post('/auth/change-password', data);
    },
    verifyEmail: (token) => {
        return axiosClient.post('/auth/verify-email', { token });
    },
};

export default authApi;
