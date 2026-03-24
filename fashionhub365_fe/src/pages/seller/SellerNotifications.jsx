import React, { useCallback, useEffect, useMemo, useState } from 'react';
import notificationApi from '../../apis/notificationApi';

const SELLER_PREFIX = 'SELLER_';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'orders', label: 'Orders' },
    { id: 'returns', label: 'Returns' },
];

const getNotificationIcon = (type) => {
    if (type === 'SELLER_RETURN_REQUESTED') {
        return '↩';
    }
    if (type === 'SELLER_ORDER_CREATED') {
        return '🛒';
    }
    if (type === 'SELLER_ORDER_STATUS') {
        return '🔔';
    }
    return '•';
};

const getTypeLabel = (type) => {
    switch (type) {
        case 'SELLER_ORDER_CREATED':
            return 'New Order';
        case 'SELLER_ORDER_STATUS':
            return 'Order Update';
        case 'SELLER_RETURN_REQUESTED':
            return 'Return Request';
        default:
            return 'Seller Notice';
    }
};

const SellerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const params = { limit: 50, type_prefix: SELLER_PREFIX };
            if (activeFilter === 'unread') {
                params.is_read = false;
            }

            const res = await notificationApi.getNotifications(params);
            const items = res?.data?.items || res?.items || [];
            setNotifications(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error('Failed to load seller notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'orders') {
            return notifications.filter((item) => item.type !== 'SELLER_RETURN_REQUESTED');
        }
        if (activeFilter === 'returns') {
            return notifications.filter((item) => item.type === 'SELLER_RETURN_REQUESTED');
        }
        return notifications;
    }, [activeFilter, notifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) => prev.map((item) => (
                item._id === id ? { ...item, is_read: true } : item
            )));
        } catch (error) {
            console.error('Failed to mark seller notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead({ type_prefix: SELLER_PREFIX });
            setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all seller notifications as read:', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Seller Workspace</p>
                    <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                    <p className="text-sm text-slate-500 mt-1">Keep up with new orders, return requests and important store updates.</p>
                </div>
                <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            activeFilter === filter.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-10 text-center text-slate-400">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No seller notifications yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredNotifications.map((item) => (
                            <div
                                key={item._id}
                                className={`flex items-start gap-4 p-5 ${item.is_read ? 'bg-white' : 'bg-indigo-50/30'}`}
                            >
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                                    {getNotificationIcon(item.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            {getTypeLabel(item.type)}
                                        </span>
                                        {!item.is_read && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                                                Unread
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${item.is_read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                        {item.message}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </span>
                                        {!item.is_read && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkAsRead(item._id)}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerNotifications;
