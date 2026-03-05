import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api/v1', // Adjusted to match BE prefix
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

// Interceptor to handle Token Refresh on 401
axiosClient.interceptors.response.use(
    (response) => {
        return response.data; // Return only data
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const response = await axios.post(
                    'http://localhost:5000/api/v1/auth/refresh',
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
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
