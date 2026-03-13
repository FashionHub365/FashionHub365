import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatBox } from './ChatBox';

export const ChatWidget = () => {
    const { isAuthenticated } = useAuth();
    const { sessions, isOpen, openSession, closeChat } = useChat();
    const [showList, setShowList] = useState(false);
    const listRef = useRef(null);

    // Lọc ra các session của mình với tư cách người mua (có store_id được populate là object)
    const buyerSessions = sessions.filter(s => typeof s.store_id === 'object' && s.store_id !== null);
    const unreadCount = buyerSessions.reduce((sum, s) => sum + (Number(s.unreadCount) || 0), 0);

    // Đóng danh sách khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (listRef.current && !listRef.current.contains(e.target)) {
                setShowList(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!isAuthenticated) return null;

    const handleToggle = () => {
        if (isOpen) {
            closeChat();
            setShowList(false);
        } else {
            setShowList((prev) => !prev);
        }
    };

    return (
        <>
            {/* Floating button */}
            <div className="fixed bottom-5 right-5 z-[200]" ref={listRef}>
                <button
                    onClick={handleToggle}
                    className="w-14 h-14 rounded-full bg-black text-white shadow-xl flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110 relative"
                    aria-label="Mở chat"
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#ef4444] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg border-2 border-white z-[9999] pointer-events-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Session List Dropdown */}
                {showList && !isOpen && (
                    <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900">Tin nhắn</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {buyerSessions.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-8">Chưa có cuộc trò chuyện nào</p>
                            ) : (
                                buyerSessions.map((session) => {
                                    const name =
                                        session.store_id?.name ||
                                        session.user_id?.username ||
                                        'Người dùng';
                                    const avatar =
                                        session.store_id?.avatar ||
                                        session.user_id?.profile?.avatar_url;
                                    const lastMsg = session.lastMessage?.message || 'Bắt đầu cuộc trò chuyện';
                                    return (
                                        <button
                                            key={session._id}
                                            onClick={() => { openSession(session); setShowList(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                {avatar
                                                    ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{name[0]?.toUpperCase()}</div>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                                <p className="text-xs text-gray-400 truncate">{lastMsg}</p>
                                            </div>
                                            {session.unreadCount > 0 && (
                                                <span className="bg-[#ef4444] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    {session.unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ChatBox popup */}
            <ChatBox />
        </>
    );
};
