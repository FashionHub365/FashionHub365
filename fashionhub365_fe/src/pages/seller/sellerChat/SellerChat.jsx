import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';

const SellerChat = () => {
    const { sessions, activeSession, messages, sendMessage, openSession, closeChat } = useChat();
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // Clean up active session when leaving the page
    useEffect(() => {
        return () => {
            closeChat();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const partnerName = activeSession?.user_id?.profile?.full_name || activeSession?.user_id?.username || 'Khách hàng';
    const partnerAvatar = activeSession?.user_id?.profile?.avatar_url;
    const myId = String(user?._id || user?.id || '');
    
    // Lọc ra các session mà user này đóng vai trò là seller (user_id được populate là object)
    const sellerSessionsList = sessions.filter(s => typeof s.user_id === 'object' && s.user_id !== null);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex overflow-hidden h-[calc(100vh-140px)] min-h-[500px]">
            {/* Sidebar: Danh sách chat */}
            <div className="w-1/3 flex flex-col bg-gray-50/50 relative border-r border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Tin nhắn khách hàng</h2>
                    <p className="text-sm text-gray-500 mt-1">{sellerSessionsList.length} cuộc trò chuyện</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sellerSessionsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm">Chưa có tin nhắn nào</p>
                        </div>
                    ) : (
                        sellerSessionsList.map((session) => {
                            const customer = session.user_id;
                            const name = customer?.profile?.full_name || customer?.username || 'Khách hàng';
                            const avatar = customer?.profile?.avatar_url;
                            const lastMsg = session.lastMessage?.message || '...';
                            const isActive = activeSession?._id === session._id;

                            return (
                                <button
                                    key={session._id}
                                    onClick={() => openSession(session)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors border-b border-gray-50 ${
                                        isActive ? 'bg-indigo-50/50' : 'hover:bg-white'
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                        {avatar
                                            ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{name[0]?.toUpperCase()}</div>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className={`text-sm truncate ${isActive ? 'font-bold text-indigo-900' : 'font-semibold text-gray-900'}`}>{name}</p>
                                        </div>
                                        <p className={`text-sm truncate ${session.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{lastMsg}</p>
                                    </div>
                                    {session.unreadCount > 0 && (
                                        <span className="bg-[#ef4444] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {session.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Content: Khung Chat */}
            <div className="flex-1 flex flex-col bg-white">
                {activeSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white shadow-sm z-10">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {partnerAvatar
                                    ? <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-base font-bold text-gray-500">{partnerName[0]?.toUpperCase()}</div>
                                }
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{partnerName}</h3>
                                <p className="text-xs text-green-500 font-medium">Đang hoạt động</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Bắt đầu cuộc trò chuyện với khách hàng</p>
                                </div>
                            )}
                            {messages.map((msg, index) => {
                                const isMine = String(msg.sender_user_id?._id || msg.sender_user_id) === myId;
                                const timeString = new Date(msg.sent_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                
                                return (
                                    <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed relative group ${
                                            isMine
                                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-200'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'
                                        }`}>
                                            {msg.message}
                                            <span className={`text-[11px] mt-1 flex items-center ${isMine ? 'text-indigo-200 justify-end' : 'text-gray-400'}`}>
                                                {timeString}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSend} className="flex items-end gap-3">
                                <div className="flex-1 bg-white border-2 border-gray-200 rounded-full focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all overflow-hidden flex items-center shadow-sm">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Nhập tin nhắn trả lời..."
                                        className="w-full bg-transparent px-6 py-3 outline-none text-[15px]"
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="h-[52px] px-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 shrink-0 gap-2 font-semibold text-[15px]"
                                >
                                    <span>Gửi</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Chưa chọn chat nào</h3>
                        <p className="text-sm mt-2">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerChat;
