import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../apis/notificationApi';

const NotificationDropdown = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications({ limit: 10 });
            if (res.data?.success) {
                setNotifications(res.data.data.items || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (e, id, isRead) => {
        e.stopPropagation();
        if (isRead) return;
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleReadAll = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_STATUS': return '📦';
            case 'SYSTEM': return '⚙️';
            case 'PROMOTION': return '🎉';
            default: return '🔔';
        }
    };

    return (
        <div ref={dropdownRef} className="absolute top-12 right-0 w-80 md:w-96 bg-white shadow-xl border border-gray-100 rounded-lg z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                <button
                    onClick={handleReadAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={(e) => handleRead(e, notif._id, notif.is_read)}
                                className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                            >
                                <div className="text-2xl mt-0.5">{getIcon(notif.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'} line-clamp-2`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notif.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!notif.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                <button
                    onClick={() => {
                        navigate('/notifications');
                        onClose();
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    View all notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
