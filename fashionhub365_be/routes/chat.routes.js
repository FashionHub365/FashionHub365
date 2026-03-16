const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middleware/auth');

// Tất cả routes chat đều cần đăng nhập
router.use(auth());

// Tạo / mở lại session
router.post('/sessions', chatController.getOrCreateSession);

// Danh sách sessions (user hoặc seller)
router.get('/sessions', chatController.getMySessions);

// Lịch sử tin nhắn
router.get('/sessions/:sessionId/messages', chatController.getMessages);

// Đánh dấu đã đọc
router.patch('/sessions/:sessionId/read', chatController.markRead);

// AI Chat (Gemini)
router.post('/gemini', chatController.geminiChat);
router.get('/history', chatController.getChatHistory);

module.exports = router;
