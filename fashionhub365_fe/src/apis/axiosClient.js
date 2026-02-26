import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api/v1', // Adjusted to match BE prefix
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
            const tokens = JSON.parse(localStorage.getItem('tokens'));

            if (tokens && tokens.refresh && tokens.refresh.token) {
                try {
                    const response = await axios.post('http://localhost:5000/api/v1/auth/refresh-token', {
                        refreshToken: tokens.refresh.token,
                    });

                    if (response.data.success) {
                        const newTokens = response.data.data.tokens;
                        localStorage.setItem('tokens', JSON.stringify(newTokens));

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;
                        return axiosClient(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    localStorage.removeItem('tokens');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } else {
                localStorage.removeItem('tokens');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
