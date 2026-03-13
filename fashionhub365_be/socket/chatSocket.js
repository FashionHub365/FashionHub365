const chatService = require('../services/chat.service');
const { Store } = require('../models');

/**
 * chatSocket(io) - Đăng ký các socket events cho chat realtime
 * 
 * Events từ client:
 *   join_session  { sessionId }      → socket joins room = sessionId
 *   send_message  { sessionId, message, senderUserId } → lưu DB + broadcast
 *   mark_read     { sessionId, readerUserId }          → cập nhật is_read
 * 
 * Events server phát:
 *   new_message   { message }   → tới tất cả trong room
 *   messages_read { sessionId } → thông báo đầu kia đã đọc
 */
const chatSocket = (io) => {
    io.on('connection', (socket) => {
        // ── Join vào room của 1 session ──────────────────────────────
        socket.on('join_session', ({ sessionId }) => {
            if (!sessionId) return;
            socket.join(sessionId);
        });

        // ── Gửi tin nhắn ──────────────────────────────────────────────
        socket.on('send_message', async ({ sessionId, message, senderUserId }) => {
            if (!sessionId || !message || !senderUserId) return;
            try {
                const savedMsg = await chatService.saveMessage(sessionId, senderUserId, message.trim());
                // Broadcast tới TẤT CẢ trong room (cả người gửi để đồng bộ nhiều tab)
                io.to(sessionId).emit('new_message', savedMsg);
            } catch (err) {
                console.error('[ChatSocket] send_message error:', err.message);
                socket.emit('chat_error', { message: 'Failed to send message' });
            }
        });

        // ── Đánh dấu đã đọc ──────────────────────────────────────────
        socket.on('mark_read', async ({ sessionId, readerUserId }) => {
            if (!sessionId || !readerUserId) return;
            try {
                await chatService.markMessagesRead(sessionId, readerUserId);
                // Thông báo cho phía kia biết tin đã được đọc
                socket.to(sessionId).emit('messages_read', { sessionId });
            } catch (err) {
                console.error('[ChatSocket] mark_read error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            // Socket.IO tự dọn room, không cần làm gì thêm
        });
    });
};

module.exports = chatSocket;
