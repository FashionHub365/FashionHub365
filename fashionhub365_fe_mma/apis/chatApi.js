import axiosClient from './axiosClient';

/**
 * Chat API - Handle sessions and messages for buyers and sellers
 */
const chatApi = {
    /** 
     * Get or create a session with a store (for buyers)
     * For sellers, sessions are usually created by buyers
     */
    getOrCreateSession: (storeId) =>
        axiosClient.post('/chat/sessions', { storeId }),

    /** 
     * Get list of chat sessions for the current user (buyer or seller)
     */
    getMySessions: () =>
        axiosClient.get('/chat/sessions'),

    /** 
     * Get message history for a session
     */
    getMessages: (sessionId, limit = 50, before = null) => {
        const params = { limit };
        if (before) params.before = before;
        return axiosClient.get(`/chat/sessions/${sessionId}/messages`, { params });
    },

    /** 
     * Mark a session's messages as read
     */
    markRead: (sessionId) =>
        axiosClient.patch(`/chat/sessions/${sessionId}/read`),

    /** 
     * Gemini AI Chat
     */
    sendGeminiMessage: (prompt, history = []) => {
        return axiosClient.post('/chat/gemini', { prompt, history });
    },

    getGeminiHistory: () => {
        return axiosClient.get('/chat/history');
    }
};

export default chatApi;
