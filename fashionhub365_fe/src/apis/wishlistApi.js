import axiosClient from './axiosClient';

const wishlistApi = {
    getWishlist: (page = 1, limit = 6) => {
        return axiosClient.get(`/wishlist?page=${page}&limit=${limit}`);
    },
    addToWishlist: (productId) => {
        return axiosClient.post('/wishlist', { productId });
    },
    removeFromWishlist: (productId) => {
        return axiosClient.delete(`/wishlist/${productId}`);
    },
};

export default wishlistApi;