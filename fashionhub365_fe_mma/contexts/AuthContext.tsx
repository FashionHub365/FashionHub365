// @ts-nocheck
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import authApi from '../apis/authApi';

const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedTokensStr = await getStorageItem('tokens');
                const storedUserStr = await getStorageItem('user');

                if (storedTokensStr && storedUserStr) {
                    setUser(JSON.parse(storedUserStr));
                    setIsAuthenticated(true);
                    
                    try {
                        const response = await authApi.getMe();
                        if (response && response.success) {
                            setUser(response.data.user);
                            await setStorageItem('user', JSON.stringify(response.data.user));
                        }
                    } catch (error) {
                        console.error("Auth check failed", error);
                    }
                }
            } catch (err) {
                console.error("Error reading from AsyncStorage during init", err);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (identifier: string, password: string, rememberMe = true) => {
        try {
            const response = await authApi.login({ identifier, password, rememberMe });
            if (response && response.success) {
                if (response.data.requiresOtp === false && response.data.user && response.data.tokens) {
                    const { user, tokens } = response.data;
                    await setStorageItem('tokens', JSON.stringify(tokens));
                    await setStorageItem('user', JSON.stringify(user));
                    setUser(user);
                    setIsAuthenticated(true);
                    return { success: true, requiresOtp: false };
                }

                return {
                    success: true,
                    requiresOtp: true,
                    email: response.data.email,
                    message: response.data.message,
                    otpCode: response.data.otpCode,
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const verifyOtpLogin = async (email: string, otpCode: string, rememberMe = true) => {
        try {
            const response = await authApi.verifyOtp({ email, otpCode, rememberMe });
            if (response && response.success) {
                const { user, tokens } = response.data;
                await setStorageItem('tokens', JSON.stringify(tokens));
                await setStorageItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'OTP verification failed'
            };
        }
    };

    const googleLogin = async (code: string) => {
        try {
            const response = await authApi.googleLogin(code);
            if (response && response.success) {
                const { user, tokens } = response.data;
                await setStorageItem('tokens', JSON.stringify(tokens));
                await setStorageItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Google Login failed'
            };
        }
    };

    const register = async (data: any) => {
        try {
            const response = await authApi.register(data);
            return response; 
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            const response = await authApi.forgotPassword(email);
            return response;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send reset email'
            };
        }
    };

    const resetPassword = async (token: string, newPassword: string) => {
        try {
            const response = await authApi.resetPassword({ token, newPassword, confirmPassword: newPassword });
            return response;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to reset password'
            };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout API error', error);
        }
        await removeStorageItem('tokens');
        await removeStorageItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, verifyOtpLogin, googleLogin, register, forgotPassword, resetPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
