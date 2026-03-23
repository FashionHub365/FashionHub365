import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import chatApi from '../apis/chatApi';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getSocketUrl = (apiUrl) => {
    try {
        return new URL(apiUrl).origin;
    } catch {
        return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/api\/?$/, '') || 'http://localhost:5000';
    }
};

const SOCKET_URL = getSocketUrl(API_URL);

export const ChatProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const sessionsRef = useRef([]);
    const activeSessionRef = useRef(null);

    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        sessionsRef.current = sessions;
    }, [sessions]);

    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    const unreadCount = sessions.reduce((sum, session) => sum + (session.unreadCount || 0), 0);

    const joinKnownRooms = useCallback((socket, sessionsToJoin = sessionsRef.current, currentActiveSession = activeSessionRef.current) => {
        if (!socket?.connected) return;

        sessionsToJoin.forEach((session) => {
            if (session?._id) {
                socket.emit('join_session', { sessionId: session._id });
            }
        });

        if (currentActiveSession?._id) {
            socket.emit('join_session', { sessionId: currentActiveSession._id });
        }
    }, []);

    const loadSessions = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const res = await chatApi.getMySessions();
            if (!res.success) return;

            setSessions(res.data);
            joinKnownRooms(socketRef.current, res.data, activeSessionRef.current);
        } catch {
            // Ignore chat sidebar refresh errors for now.
        }
    }, [isAuthenticated, joinKnownRooms]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        if (!isAuthenticated || !user) return undefined;

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            joinKnownRooms(socket);
        });

        socket.on('new_message', (msg) => {
            setMessages((prev) => {
                if (prev.some((message) => message._id === msg._id)) return prev;

                const isForActiveSession = activeSessionRef.current && String(activeSessionRef.current._id) === String(msg.chat_session_id);
                if (!isForActiveSession) return prev;

                return [...prev, msg];
            });

            setSessions((prev) => {
                const sessionExists = prev.some((session) => String(session._id) === String(msg.chat_session_id));

                if (!sessionExists) {
                    loadSessions();
                    return prev;
                }

                return prev.map((session) => {
                    if (String(session._id) !== String(msg.chat_session_id)) return session;

                    const isActive = activeSessionRef.current && String(activeSessionRef.current._id) === String(msg.chat_session_id);

                    return {
                        ...session,
                        lastMessage: msg,
                        unreadCount: isActive ? 0 : (session.unreadCount || 0) + 1,
                    };
                });
            });
        });

        socket.on('messages_read', ({ sessionId }) => {
            setSessions((prev) =>
                prev.map((session) => (
                    String(session._id) === String(sessionId)
                        ? { ...session, unreadCount: 0 }
                        : session
                ))
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, joinKnownRooms, loadSessions, user]);

    const openChat = useCallback(async (storeId, storeInfo = null) => {
        if (!isAuthenticated) return;

        try {
            const res = await chatApi.getOrCreateSession(storeId);
            if (!res.success) return;

            const session = { ...res.data, store: storeInfo };
            setActiveSession(session);
            setIsOpen(true);

            const msgRes = await chatApi.getMessages(session._id);
            if (msgRes.success) {
                setMessages(msgRes.data);
            }

            socketRef.current?.emit('join_session', { sessionId: session._id });

            await chatApi.markRead(session._id);
            socketRef.current?.emit('mark_read', { sessionId: session._id, readerUserId: user?._id || user?.id });

            await loadSessions();
        } catch (err) {
            console.error('[ChatContext] openChat error:', err);
        }
    }, [isAuthenticated, loadSessions, user]);

    const openSession = useCallback(async (session) => {
        setActiveSession(session);
        setIsOpen(true);

        const msgRes = await chatApi.getMessages(session._id);
        if (msgRes.success) {
            setMessages(msgRes.data);
        }

        socketRef.current?.emit('join_session', { sessionId: session._id });
        await chatApi.markRead(session._id);
        socketRef.current?.emit('mark_read', { sessionId: session._id, readerUserId: user?._id || user?.id });
        await loadSessions();
    }, [loadSessions, user]);

    const sendMessage = useCallback((message) => {
        if (!activeSession || !message.trim() || !socketRef.current) return;

        socketRef.current.emit('send_message', {
            sessionId: activeSession._id,
            message: message.trim(),
            senderUserId: user?._id || user?.id,
        });
    }, [activeSession, user]);

    const closeChat = useCallback(() => {
        setIsOpen(false);
        setActiveSession(null);
        setMessages([]);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                sessions,
                activeSession,
                messages,
                isOpen,
                unreadCount,
                openChat,
                openSession,
                sendMessage,
                closeChat,
                loadSessions,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
