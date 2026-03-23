import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import cartApi from '../apis/cartApi';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { isPrivilegedCommerceUser } from '../utils/roleUtils';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const isBlockedBuyer = isPrivilegedCommerceUser(user);

    const [cartData, setCartData] = useState({ items: [], totalItems: 0, totalAmount: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated || isBlockedBuyer) {
            setCartData({ items: [], totalItems: 0, totalAmount: 0 });
            return;
        }
        try {
            const res = await cartApi.getCart();
            if (res.success) setCartData(res.data);
        } catch {
            // Silently fail – user may not be logged in
        }
    }, [isAuthenticated, isBlockedBuyer]);

    // Load cart whenever authentication state changes
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = useCallback(async (productId, variantId, quantity = 1) => {
        if (isBlockedBuyer) {
            return { success: false, message: 'Admin and seller accounts cannot purchase products.' };
        }
        setLoading(true);
        try {
            const res = await cartApi.addItem(productId, variantId, quantity);
            if (res.success) {
                setCartData(res.data);
                setIsCartOpen(true); // Open sidebar on success
                toast.success('Product added to cart');
            }
            return { success: true };
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Error occurred while adding to cart.';
            if (status === 401) return { success: false, message: 'Please log in to add to cart.' };
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, [isBlockedBuyer]);

    const updateItem = useCallback(async (itemId, quantity) => {
        try {
            const res = await cartApi.updateItem(itemId, quantity);
            if (res.success) {
                setCartData(res.data);
                toast.success('Cart updated successfully');
            }
        } catch (err) {
            console.error('Update cart item failed:', err);
        }
    }, []);

    const removeItem = useCallback(async (itemId) => {
        try {
            const res = await cartApi.removeItem(itemId);
            if (res.success) {
                setCartData(res.data);
                toast.success('Product removed from cart');
            }
        } catch (err) {
            console.error('Remove cart item failed:', err);
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            await cartApi.clearCart();
            setCartData({ items: [], totalItems: 0, totalAmount: 0 });
            toast.success('Cart cleared completely');
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
            isBlockedBuyer,
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
