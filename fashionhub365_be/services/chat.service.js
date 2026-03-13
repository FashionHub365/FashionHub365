const { ChatMessage, ChatSession } = require('../models');

/**
 * Service to handle chat history persistence.
 */
const chatService = {
    /**
     * Save a message to the database
     */
    saveMessage: async ({ userId, role, text }) => {
        try {
            // For this implementation, we use a simple approach:
            // If userId exists, we could link it to a session. 
            // For now, we'll store basic messages.
            const message = await ChatMessage.create({
                sender_user_id: role === 'user' ? userId : null,
                role,
                message: text,
                sent_at: new Date()
            });
            return message;
        } catch (error) {
            console.error('[ChatService] Save Error:', error.message);
        }
    },

    /**
     * Get recent history for a user
     */
    getHistory: async (userId) => {
        try {
            if (!userId) return [];

            // Get last 20 messages for this user
            const messages = await ChatMessage.find({
                $or: [
                    { sender_user_id: userId },
                    { role: 'model' } // In a real app, you'd filter by session
                ]
            })
                .sort({ sent_at: -1 })
                .limit(20)
                .lean();

            // Reverse to get chronological order and format for frontend
            return messages.reverse().map(m => ({
                role: m.role,
                text: m.message
            }));
        } catch (error) {
            console.error('[ChatService] Get History Error:', error.message);
            return [];
        }
    }
};

module.exports = chatService;
