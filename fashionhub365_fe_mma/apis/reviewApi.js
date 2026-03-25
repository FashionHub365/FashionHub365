import axiosClient from './axiosClient';

/**
 * Review API - Seller specific management
 */
const reviewApi = {
    /**
     * Get reviews for a specific product (Seller view, includes hidden reviews)
     * @param {string} productId 
     */
    getSellerProductReviews: (productId) => {
        return axiosClient.get(`/products/${productId}/reviews`);
    },

    /**
     * Respond to a customer's review
     * @param {string} productId 
     * @param {string} reviewId 
     * @param {string} responseText 
     */
    respondToReview: (productId, reviewId, responseText) => {
        return axiosClient.post(`/products/${productId}/reviews/${reviewId}/respond`, { responseText });
    },

    /**
     * Toggle visibility of a review (Show/Hide from public)
     * @param {string} productId 
     * @param {string} reviewId 
     */
    toggleReviewVisibility: (productId, reviewId) => {
        return axiosClient.patch(`/products/${productId}/reviews/${reviewId}/toggle-visibility`);
    }
};

export default reviewApi;
