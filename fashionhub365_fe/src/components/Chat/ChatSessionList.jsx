import React from 'react';
import { useChat } from '../../contexts/ChatContext';

/**
 * ChatSessionList - Dành cho Seller Dashboard
 * Hiển thị danh sách tất cả các cuộc chat của store
 */
export const ChatSessionList = () => {
    const { sessions, openSession, activeSession } = useChat();

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Tin nhắn từ khách</h2>
                <p className="text-xs text-gray-400">{sessions.length} cuộc trò chuyện</p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs">Chưa có tin nhắn nào</p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const customer = session.user_id;
                        const name = customer?.profile?.full_name || customer?.username || 'Khách hàng';
                        const avatar = customer?.profile?.avatar_url;
                        const lastMsg = session.lastMessage?.message || '...';
                        const isActive = activeSession?._id === session._id;

                        return (
                            <button
                                key={session._id}
                                onClick={() => openSession(session)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 ${
                                    isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
                                }`}
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
                                    <span className="bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        {session.unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};
