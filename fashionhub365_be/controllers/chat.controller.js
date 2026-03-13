const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const aiService = require('../services/ai.service');
const chatService = require('../services/chat.service');

const geminiChat = catchAsync(async (req, res) => {
    const { prompt, history } = req.body;
    const userId = req.user?._id; // Try to get user ID from auth middleware

    if (!prompt) {
        return res.status(httpStatus.BAD_REQUEST).send({
            success: false,
            message: 'Prompt is required',
        });
    }

    // 1. Save user message to DB
    await chatService.saveMessage({ userId, role: 'user', text: prompt });

    // 2. Generate AI response
    const response = await aiService.generateResponse(prompt, history);

    // 3. Save AI response to DB
    await chatService.saveMessage({ userId, role: 'model', text: response });

    res.status(httpStatus.OK).send({
        success: true,
        data: {
            response
        }
    });
});

const getChatHistory = catchAsync(async (req, res) => {
    const userId = req.user?._id;
    const history = await chatService.getHistory(userId);
    res.status(httpStatus.OK).send({
        success: true,
        data: history
    });
});

module.exports = {
    geminiChat,
    getChatHistory
};
