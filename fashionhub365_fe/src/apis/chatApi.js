import axiosClient from './axiosClient';

const chatApi = {
    /** Tạo hoặc mở lại session với 1 store */
    getOrCreateSession: (storeId) =>
        axiosClient.post('/chat/sessions', { storeId }),

    /** Danh sách sessions của user/seller hiện tại */
    getMySessions: () =>
        axiosClient.get('/chat/sessions'),

    /** Lịch sử tin nhắn trong 1 session */
    getMessages: (sessionId, limit = 50, before = null) => {
        const params = { limit };
        if (before) params.before = before;
        return axiosClient.get(`/chat/sessions/${sessionId}/messages`, { params });
    },

    /** Đánh dấu đã đọc */
    markRead: (sessionId) =>
        axiosClient.patch(`/chat/sessions/${sessionId}/read`),

    /** AI Chat (Gemini) */
    sendMessage: (prompt, history = []) => {
        return axiosClient.post('/chat/gemini', { prompt, history });
    },
    getHistory: () => {
        return axiosClient.get('/chat/history');
    }
};

export default chatApi;
