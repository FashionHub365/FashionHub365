import React, { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../apis/authApi';

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

    const login = async (email, password) => {
        try {
            const response = await authApi.login({ email, password });
            if (response.success) {
                const { user, tokens } = response.data;
                localStorage.setItem('tokens', JSON.stringify(tokens));
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
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
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (tokens?.refresh?.token) {
            try {
                await authApi.logout(tokens.refresh.token);
            } catch (error) {
                console.error('Logout API error', error);
            }
        }
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
