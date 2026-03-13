import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

export const ChatBox = () => {
    const { activeSession, messages, sendMessage, closeChat, isOpen } = useChat();
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

    if (!isOpen || !activeSession) return null;

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    // Lấy tên store/partner
    const partnerName =
        activeSession.store?.name ||
        activeSession.store_id?.name ||
        activeSession.user_id?.username ||
        'Chat';

    const myId = String(user?._id || user?.id || '');

    return (
        <div className="fixed bottom-20 right-5 w-[340px] max-h-[500px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {partnerName[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold truncate max-w-[200px]">{partnerName}</span>
                </div>
                <button onClick={closeChat} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Đóng chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50 min-h-[300px] max-h-[360px]">
                {messages.length === 0 && (
                    <p className="text-center text-xs text-gray-400 mt-10">Bắt đầu cuộc trò chuyện 👋</p>
                )}
                {messages.map((msg) => {
                    const isMine = String(msg.sender_user_id?._id || msg.sender_user_id) === myId;
                    return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[230px] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                    ? 'bg-black text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            }`}>
                                {msg.message}
                                <span className={`block text-[10px] mt-0.5 ${isMine ? 'text-white/50' : 'text-gray-400'}`}>
                                    {new Date(msg.sent_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-white">
                <input
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-gray-400 transition-colors"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    aria-label="Gửi tin nhắn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </form>
        </div>
    );
};
