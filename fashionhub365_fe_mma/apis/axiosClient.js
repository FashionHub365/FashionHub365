import axios from 'axios';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { router } from 'expo-router';

// In Expo, process.env variables need to be prefixed with EXPO_PUBLIC_
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api/v1'; // Default for Android Emulator

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add Access Token to requests
axiosClient.interceptors.request.use(
    async (config) => {
        try {
            const tokensStr = await getStorageItem('tokens');
            if (tokensStr) {
                const tokens = JSON.parse(tokensStr);
                if (tokens && tokens.access && tokens.access.token) {
                    config.headers.Authorization = `Bearer ${tokens.access.token}`;
                }
            }
        } catch (error) {
            console.error('Error reading tokens from AsyncStorage for request:', error);
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
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (response.data.success) {
                    const currentTokensStr = await getStorageItem('tokens');
                    const currentTokens = currentTokensStr ? JSON.parse(currentTokensStr) : {};

                    const newTokens = {
                        ...currentTokens,
                        ...response.data.data.tokens,
                    };

                    await setStorageItem('tokens', JSON.stringify(newTokens));
                    originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;

                    return axiosClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                await removeStorageItem('tokens');
                await removeStorageItem('user');

                // Redirect logic requires router from expo-router
                if (router) {
                    router.replace('/login');
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
