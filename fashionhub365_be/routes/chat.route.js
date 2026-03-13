const express = require('express');
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// The auth middleware in this project is a factory function auth()
router.post('/gemini', auth(), chatController.geminiChat);
router.get('/history', auth(), chatController.getChatHistory);

module.exports = router;
