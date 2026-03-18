const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const chatService = require('../services/chat.service');
const aiService = require('../services/ai.service');
const { Store } = require('../models');

/**
 * POST /api/v1/chat/sessions
 * User tạo hoặc mở lại session với 1 store
 * Body: { storeId }
 */
const getOrCreateSession = catchAsync(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { storeId } = req.body;
    if (!storeId) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'storeId is required' });
    }
    const session = await chatService.getOrCreateSession(userId, storeId);
    res.status(httpStatus.OK).json({ success: true, data: session });
});

/**
 * GET /api/v1/chat/sessions
 * Lấy danh sách sessions của user hiện tại (hoặc store của seller)
 */
const getMySessions = catchAsync(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    let [userSessions, sellerSessions] = [[], []];

    // 1. Fetch user sessions (dưới tư cách người mua)
    userSessions = await chatService.getSessionsByUser(userId);

    // 2. Fetch seller sessions (nếu có store)
    const { StoreMember, Store } = require('../models');
    const ownedStores = await Store.find({ owner_user_id: userId }).select('_id').lean();
    const memberStores = await StoreMember.find({ user_id: userId }).select('store_id').lean();
    
    const storeIds = [
        ...ownedStores.map(s => s._id),
        ...memberStores.map(m => m.store_id)
    ];
    
    if (storeIds.length > 0) {
        const allSessions = await Promise.all(
            storeIds.map(id => chatService.getSessionsByStore(id))
        );
        sellerSessions = allSessions.flat();
    }

    // Gộp tất cả sessions lại, sắp xếp theo thời gian mới nhất (id giảm dần nếu không có created_at, nhưng đã có schema)
    const combinedSessions = [...userSessions, ...sellerSessions]
                            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(httpStatus.OK).json({ success: true, data: combinedSessions });
});

/**
 * GET /api/v1/chat/sessions/:sessionId/messages
 * Lịch sử tin nhắn trong 1 session
 * Query: limit, before (ISO date for pagination)
 */
const getMessages = catchAsync(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 50, before } = req.query;
    const messages = await chatService.getMessages(sessionId, limit, before);
    res.status(httpStatus.OK).json({ success: true, data: messages });
});

/**
 * PATCH /api/v1/chat/sessions/:sessionId/read
 * Đánh dấu đã đọc tất cả tin trong session
 */
const markRead = catchAsync(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;
    await chatService.markMessagesRead(sessionId, userId);
    res.status(httpStatus.OK).json({ success: true });
});

const geminiChat = catchAsync(async (req, res) => {
    const { prompt, history } = req.body;
    const userId = req.user?._id;

    if (!prompt) {
        return res.status(httpStatus.BAD_REQUEST).send({
            success: false,
            message: 'Prompt is required',
        });
    }

    // 1. Save user message to DB
    await chatService.saveMessageForAI({ userId, role: 'user', text: prompt });

    // 2. Generate AI response
    const response = await aiService.generateResponse(prompt, history);

    // 3. Save AI response to DB
    await chatService.saveMessageForAI({ userId, role: 'model', text: response });

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
    getOrCreateSession, 
    getMySessions, 
    getMessages, 
    markRead,
    geminiChat,
    getChatHistory
};
