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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Interceptor to handle Token Refresh on 401
axiosClient.interceptors.response.use(
    (response) => {
        return response.data; // Return only data
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const tokensStr = await getStorageItem('tokens');
                const tokens = tokensStr ? JSON.parse(tokensStr) : null;
                const refreshToken = tokens?.refresh?.token;

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    { refreshToken },
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
                    const newToken = newTokens.access.token;

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    processQueue(null, newToken);

                    return axiosClient(originalRequest);
                } else {
                    throw new Error('Refresh failed on server');
                }
            } catch (refreshError) {
                console.error('Token refresh failed (Phase 7 Fix):', refreshError);
                processQueue(refreshError, null);

                await removeStorageItem('tokens');
                await removeStorageItem('user');

                if (router) {
                    router.replace('/login');
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
