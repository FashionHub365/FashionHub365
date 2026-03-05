import axiosClient from './axiosClient';

const cartApi = {
    /** GET /api/v1/cart */
    getCart: () => axiosClient.get('/cart'),

    /** POST /api/v1/cart/items */
    addItem: (productId, variantId, quantity = 1) =>
        axiosClient.post('/cart/items', { productId, variantId, quantity }),

    /** PATCH /api/v1/cart/items/:itemId */
    updateItem: (itemId, quantity) =>
        axiosClient.patch(`/cart/items/${itemId}`, { quantity }),

    /** DELETE /api/v1/cart/items/:itemId */
    removeItem: (itemId) =>
        axiosClient.delete(`/cart/items/${itemId}`),

    /** DELETE /api/v1/cart */
    clearCart: () =>
        axiosClient.delete('/cart'),

    /** GET /api/v1/products/cart-recommendations */
    getCartRecommendations: ({ cartProductIds = [], storeIds = [], categoryIds = [], cartTotal = 0, limit = 4 }) =>
        axiosClient.get('/products/cart-recommendations', {
            params: {
                cartProductIds: cartProductIds.join(','),
                storeIds: storeIds.join(','),
                categoryIds: categoryIds.join(','),
                cartTotal,
                limit,
            },
        }),
};

export default cartApi;
