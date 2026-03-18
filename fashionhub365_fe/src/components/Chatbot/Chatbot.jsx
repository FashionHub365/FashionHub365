import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import chatApi from '../../apis/chatApi';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Xin chào! Tôi là trợ lý ảo FashionHub365. Tôi có thể giúp gì cho bạn?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadHistory = async () => {
            if (isOpen) {
                try {
                    const res = await chatApi.getHistory();
                    if (res.success && res.data.length > 0) {
                        setMessages(res.data);
                    }
                } catch (error) {
                    console.error('Failed to load chat history:', error);
                }
            }
        };
        loadHistory();
    }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for Gemini (transform to {role, parts: [{text}]})
            const history = messages.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            const res = await chatApi.sendMessage(userMessage, history);
            if (res.success) {
                setMessages(prev => [...prev, { role: 'model', text: res.data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Không thể kết nối với máy chủ AI.';
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg) => {
        const parts = msg.text.split(/({{PRODUCT_CARD\|.*?}})/g);

        return (
            <div className="message-content">
                {parts.map((part, i) => {
                    const match = part.match(/{{PRODUCT_CARD\|(.*?)\|(.*?)\|(.*?)\|(.*?)}}/);
                    if (match) {
                        const [, name, price, slug, image] = match;
                        console.log('[Chatbot] Rendering Product Card:', { name, price, slug, image });
                        return (
                            <div key={i} className="product-card-ai">
                                <img
                                    src={image || 'https://via.placeholder.com/300x200?text=FashionHub365'}
                                    alt={name}
                                    className="product-card-image"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                                />
                                <div className="product-card-info">
                                    <div className="product-card-name" title={name}>{name}</div>
                                    <div className="product-card-price">{price}</div>
                                    <Link to={`/product/${slug}`} className="product-card-btn">
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        );
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            {/* Chat Bubble Toggle */}
            <button
                className="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle chat"
            >
                {isOpen ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="text-sm font-bold text-gray-900">FashionHub365 AI</h3>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-wrapper ${msg.role}`}>
                                {renderMessage(msg)}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-wrapper model">
                                <div className="message-content loading">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading}>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
