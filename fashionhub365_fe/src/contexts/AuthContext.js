import React, { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../apis/authApi';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedTokens = localStorage.getItem('tokens');
            const storedUser = localStorage.getItem('user');

            if (storedTokens && storedUser) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
                // Optional: Verify token with getMe() to ensure it's still valid
                try {
                    const response = await authApi.getMe();
                    if (response.success) {
                        setUser(response.data.user);
                    }
                } catch (error) {
                    console.error("Auth check failed", error);
                    // If check fails (e.g. token expired and refresh failed), logout
                    // logout(); 
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (identifier, password, rememberMe = true) => {
        try {
            const response = await authApi.login({ identifier, password, rememberMe });
            if (response.success) {
                if (response.data.requiresOtp === false && response.data.user && response.data.tokens) {
                    const { user, tokens } = response.data;
                    localStorage.setItem('tokens', JSON.stringify(tokens));
                    localStorage.setItem('user', JSON.stringify(user));
                    setUser(user);
                    setIsAuthenticated(true);
                    toast.success('Login successful!');
                    return { success: true, requiresOtp: false, user };
                }

                return {
                    success: true,
                    requiresOtp: true,
                    email: response.data.email,
                    message: response.data.message,
                    otpCode: response.data.otpCode,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const verifyOtpLogin = async (email, otpCode, rememberMe = true) => {
        try {
            const response = await authApi.verifyOtp({ email, otpCode, rememberMe });
            if (response.success) {
                const { user, tokens } = response.data;
                localStorage.setItem('tokens', JSON.stringify(tokens));
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
                toast.success('OTP verification successful!');
                return { success: true, user };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const googleLogin = async (code) => {
        try {
            const response = await authApi.googleLogin(code);
            if (response.success) {
                const { user, tokens } = response.data;
                localStorage.setItem('tokens', JSON.stringify(tokens));
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
                toast.success('Google login successful!');
                return { success: true, user };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Google Login failed'
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await authApi.register(data);
            return response; // Expecting { success: true, ... }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await authApi.forgotPassword(email);
            return response;
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send reset email'
            };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            const response = await authApi.resetPassword({ token, newPassword, confirmPassword: newPassword });
            return response;
        } catch (error) {
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
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        toast.info('Logged out successfully.');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, googleLogin, register, forgotPassword, resetPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
