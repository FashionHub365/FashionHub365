import axiosClient from './axiosClient';

const chatApi = {
    sendMessage: (prompt, history = []) => {
        return axiosClient.post('/chat/gemini', { prompt, history });
    },
    getHistory: () => {
        return axiosClient.get('/chat/history');
    }
};

export default chatApi;
