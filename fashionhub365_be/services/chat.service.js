const { ChatSession, ChatMessage } = require('../models');

/**
 * Tìm hoặc tạo ChatSession giữa user và store
 */
const getOrCreateSession = async (userId, storeId) => {
    let session = await ChatSession.findOne({ user_id: userId, store_id: storeId, closed_at: null });
    if (!session) {
        session = await ChatSession.create({ user_id: userId, store_id: storeId });
    }
    return session;
};

/**
 * Danh sách sessions của 1 user (kèm tin nhắn cuối)
 */
const getSessionsByUser = async (userId) => {
    const sessions = await ChatSession.find({ user_id: userId })
        .populate('store_id', 'name avatar slug')
        .sort({ created_at: -1 })
        .lean();

    return Promise.all(sessions.map(async (s) => {
        const lastMsg = await ChatMessage.findOne({ chat_session_id: s._id }).sort({ sent_at: -1 }).lean();
        const unread = await ChatMessage.countDocuments({ chat_session_id: s._id, is_read: false, sender_user_id: { $ne: userId } });
        return { ...s, lastMessage: lastMsg, unreadCount: unread };
    }));
};

/**
 * Danh sách sessions của 1 store (dành cho Seller)
 */
const getSessionsByStore = async (storeId) => {
    const sessions = await ChatSession.find({ store_id: storeId })
        .populate('user_id', 'username profile.full_name profile.avatar_url')
        .sort({ created_at: -1 })
        .lean();

    return Promise.all(sessions.map(async (s) => {
        const lastMsg = await ChatMessage.findOne({ chat_session_id: s._id }).sort({ sent_at: -1 }).lean();
        const unread = await ChatMessage.countDocuments({ chat_session_id: s._id, is_read: false, sender_user_id: s.user_id._id || s.user_id });
        return { ...s, lastMessage: lastMsg, unreadCount: unread };
    }));
};

/**
 * Lịch sử tin nhắn trong 1 session
 */
const getMessages = async (sessionId, limit = 50, before = null) => {
    const query = { chat_session_id: sessionId };
    if (before) query.sent_at = { $lt: new Date(before) };
    return ChatMessage.find(query)
        .populate('sender_user_id', 'username profile.full_name profile.avatar_url')
        .sort({ sent_at: -1 })
        .limit(Number(limit))
        .lean()
        .then(msgs => msgs.reverse());
};

/**
 * Lưu tin nhắn mới (cho session giữa user và store)
 */
const saveMessage = async (sessionId, senderUserId, message) => {
    const msg = await ChatMessage.create({
        chat_session_id: sessionId,
        sender_user_id: senderUserId,
        message,
    });
    return ChatMessage.findById(msg._id)
        .populate('sender_user_id', 'username profile.full_name profile.avatar_url')
        .lean();
};

/**
 * Đánh dấu đã đọc (những tin KHÔNG do mình gửi)
 */
const markMessagesRead = async (sessionId, readerUserId) => {
    await ChatMessage.updateMany(
        { chat_session_id: sessionId, sender_user_id: { $ne: readerUserId }, is_read: false },
        { $set: { is_read: true } }
    );
};

/**
 * AI Chat History Persistence (from main branch)
 */
const chatService = {
    /**
     * Save a message for AI chat to the database
     */
    saveMessageForAI: async ({ userId, role, text }) => {
        try {
            const message = await ChatMessage.create({
                sender_user_id: role === 'user' ? userId : null,
                role,
                message: text,
                sent_at: new Date()
            });
            return message;
        } catch (error) {
            console.error('[ChatService] Save AI Message Error:', error.message);
        }
    },

    /**
     * Get recent AI history for a user
     */
    getHistory: async (userId) => {
        try {
            if (!userId) return [];
            const messages = await ChatMessage.find({
                $or: [
                    { sender_user_id: userId },
                    { role: 'model' }
                ]
            })
                .sort({ sent_at: -1 })
                .limit(20)
                .lean();

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

module.exports = {
    getOrCreateSession,
    getSessionsByUser,
    getSessionsByStore,
    getMessages,
    saveMessage,
    markMessagesRead,
    ...chatService
};
