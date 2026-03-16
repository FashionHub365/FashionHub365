import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import chatApi from '../apis/chatApi';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const ChatProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);

    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null); // { _id, store, ... }
    const [messages, setMessages] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    // Tổng số tin chưa đọc
    const unreadCount = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

    // ── Load danh sách sessions ─────────────────────────────────────────
    const loadSessions = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await chatApi.getMySessions();
            if (res.success) {
                setSessions(res.data);
                // Tự động join tất cả các room để nhận tin nhắn realtime cho các chat chưa mở
                res.data.forEach(s => {
                    socketRef.current?.emit('join_session', { sessionId: s._id });
                });
            }
        } catch { /* ignore */ }
    }, [isAuthenticated]);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    // ── Khởi tạo socket khi user đăng nhập ─────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        // Nhận tin nhắn realtime
        socket.on('new_message', (msg) => {
            setMessages((prev) => {
                // Tránh duplicate
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });

            // Cập nhật lastMessage + unreadCount trong sessions
            setSessions((prev) => {
                const sessionExists = prev.find(s => String(s._id) === String(msg.chat_session_id));
                
                if (!sessionExists) {
                    // Nếu session chưa có trong list (ví dụ khách mới chat lần đầu), load lại list
                    loadSessions();
                    return prev;
                }

                return prev.map((s) => {
                    if (String(s._id) !== String(msg.chat_session_id)) return s;
                    // Quan trọng: Phải so sánh nhạy bén với activeSessionRef
                    const isActive = activeSessionRef.current && String(activeSessionRef.current._id) === String(msg.chat_session_id);
                    return {
                        ...s,
                        lastMessage: msg,
                        unreadCount: isActive ? 0 : (s.unreadCount || 0) + 1,
                    };
                });
            });
        });

        // Đầu kia đã đọc → reset unread cho session đó
        socket.on('messages_read', ({ sessionId }) => {
            setSessions((prev) =>
                prev.map((s) => (String(s._id) === sessionId ? { ...s, unreadCount: 0 } : s))
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user, loadSessions]);

    // Ref để event listener 'new_message' có thể truy cập activeSession
    const activeSessionRef = useRef(activeSession);
    useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

    // ── Mở chat với 1 store ─────────────────────────────────────────────
    const openChat = useCallback(async (storeId, storeInfo = null) => {
        if (!isAuthenticated) return;
        try {
            const res = await chatApi.getOrCreateSession(storeId);
            if (!res.success) return;
            const session = { ...res.data, store: storeInfo };
            setActiveSession(session);
            setIsOpen(true);

            // Load lịch sử
            const msgRes = await chatApi.getMessages(session._id);
            if (msgRes.success) setMessages(msgRes.data);

            // Join socket room
            socketRef.current?.emit('join_session', { sessionId: session._id });

            // Đánh dấu đã đọc
            await chatApi.markRead(session._id);
            socketRef.current?.emit('mark_read', { sessionId: session._id, readerUserId: user._id || user.id });

            // Cập nhật sessions list
            await loadSessions();
        } catch (err) {
            console.error('[ChatContext] openChat error:', err);
        }
    }, [isAuthenticated, user, loadSessions]);

    // ── Mở session từ danh sách (dành cho seller hoặc user) ────────────
    const openSession = useCallback(async (session) => {
        setActiveSession(session);
        setIsOpen(true);

        const msgRes = await chatApi.getMessages(session._id);
        if (msgRes.success) setMessages(msgRes.data);

        socketRef.current?.emit('join_session', { sessionId: session._id });
        await chatApi.markRead(session._id);
        socketRef.current?.emit('mark_read', { sessionId: session._id, readerUserId: user?._id || user?.id });
        await loadSessions();
    }, [user, loadSessions]);

    // ── Gửi tin nhắn ───────────────────────────────────────────────────
    const sendMessage = useCallback((message) => {
        if (!activeSession || !message.trim() || !socketRef.current) return;
        socketRef.current.emit('send_message', {
            sessionId: activeSession._id,
            message: message.trim(),
            senderUserId: user?._id || user?.id,
        });
    }, [activeSession, user]);

    // ── Đóng chat ──────────────────────────────────────────────────────
    const closeChat = useCallback(() => {
        setIsOpen(false);
        setActiveSession(null);
        setMessages([]);
    }, []);

    return (
        <ChatContext.Provider value={{
            sessions, activeSession, messages, isOpen, unreadCount,
            openChat, openSession, sendMessage, closeChat, loadSessions,
        }}>
            {children}
        </ChatContext.Provider>
    );
};
