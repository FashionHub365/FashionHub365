import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add Access Token to requests
axiosClient.interceptors.request.use(
    (config) => {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (tokens && tokens.access && tokens.access.token) {
            config.headers.Authorization = `Bearer ${tokens.access.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle Token Refresh on 401 and Global Toasts
axiosClient.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toLowerCase();
        const hideToast = response.config.hideToast;
        if (!hideToast && ['post', 'put', 'patch', 'delete'].includes(method)) {
            const message = response.data?.message || response.data?.data?.message;
            if (message) {
                toast.success(message);
            }
        }
        return response.data; // Return only data
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
            originalRequest._retry = true;
            try {
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (response.data.success) {
                    const currentTokens = JSON.parse(localStorage.getItem('tokens') || '{}');
                    const newTokens = {
                        ...currentTokens,
                        ...response.data.data.tokens,
                    };
                    localStorage.setItem('tokens', JSON.stringify(newTokens));
                    originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;
                    return axiosClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('tokens');
                localStorage.removeItem('user');
                toast.error('Session expired. Please log in again.');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Show generic error toast if not suppressed
        const hideToast = originalRequest?.hideToast;
        if (!hideToast && error.response && error.response.status !== 401) {
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'An error occurred. Please try again later.';
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
