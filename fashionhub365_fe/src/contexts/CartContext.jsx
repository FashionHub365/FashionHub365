import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import cartApi from '../apis/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    const [cartData, setCartData] = useState({ items: [], totalItems: 0, totalAmount: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCartData({ items: [], totalItems: 0, totalAmount: 0 });
            return;
        }
        try {
            const res = await cartApi.getCart();
            if (res.success) setCartData(res.data);
        } catch {
            // Silently fail – user may not be logged in
        }
    }, [isAuthenticated]);

    // Load cart whenever authentication state changes
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = useCallback(async (productId, variantId, quantity = 1) => {
        setLoading(true);
        try {
            const res = await cartApi.addItem(productId, variantId, quantity);
            if (res.success) {
                setCartData(res.data);
                setIsCartOpen(true); // Open sidebar on success
            }
            return { success: true };
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng.';
            if (status === 401) return { success: false, message: 'Vui lòng đăng nhập để thêm vào giỏ hàng.' };
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    const updateItem = useCallback(async (itemId, quantity) => {
        try {
            const res = await cartApi.updateItem(itemId, quantity);
            if (res.success) setCartData(res.data);
        } catch (err) {
            console.error('Update cart item failed:', err);
        }
    }, []);

    const removeItem = useCallback(async (itemId) => {
        try {
            const res = await cartApi.removeItem(itemId);
            if (res.success) setCartData(res.data);
        } catch (err) {
            console.error('Remove cart item failed:', err);
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            await cartApi.clearCart();
            setCartData({ items: [], totalItems: 0, totalAmount: 0 });
        } catch (err) {
            console.error('Clear cart failed:', err);
        }
    }, []);

    return (
        <CartContext.Provider value={{
            cartData,
            isCartOpen,
            loading,
            setIsCartOpen,
            addToCart,
            updateItem,
            removeItem,
            clearCart,
            fetchCart,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
