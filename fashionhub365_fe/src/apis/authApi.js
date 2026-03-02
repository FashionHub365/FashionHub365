import axiosClient from './axiosClient';

const authApi = {
    register: (data) => {
        return axiosClient.post('/auth/register', data);
    },
    login: (data) => {
        return axiosClient.post('/auth/login', data);
    },
    logout: (refreshToken) => {
        return axiosClient.post('/auth/logout', { refreshToken });
    },
    getMe: () => {
        return axiosClient.get('/auth/me');
    },
    verifyEmail: (token) => {
        return axiosClient.post('/auth/verify-email', { token });
    },
};

export default authApi;
