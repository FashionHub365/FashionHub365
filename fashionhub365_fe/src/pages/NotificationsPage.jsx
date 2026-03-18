import React, { useState, useEffect, useCallback } from 'react';
import notificationApi from '../apis/notificationApi';
import Swal from 'sweetalert2';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ unread: 0, total: 0 });
    const [filter, setFilter] = useState('all'); // all, unread, orders, system, promotions

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications({
                type: filter === 'all' || filter === 'unread' ? undefined : filter.toUpperCase(),
                is_read: filter === 'unread' ? false : undefined
            });
            if (res.data?.success) {
                setNotifications(res.data.data.items || []);
                setStats({
                    unread: res.data.data.unreadCount || 0,
                    total: res.data.data.totalCount || 0
                });
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
            setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setStats(prev => ({ ...prev, unread: 0 }));
            Swal.fire({
                icon: 'success',
                title: 'All caught up!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete notification?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Delete'
        });

        if (result.isConfirmed) {
            try {
                await notificationApi.deleteNotification(id);
                setNotifications(prev => prev.filter(n => n._id !== id));
                fetchNotifications(); // Refresh stats
            } catch (error) {
                console.error('Failed to delete notification:', error);
            }
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_STATUS': return (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
            );
            case 'SYSTEM': return (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
            );
            case 'PROMOTION': return (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                </div>
            );
            default: return (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
            );
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
                    <p className="text-slate-500 mt-1">Stay updated with your orders, promotions and system alerts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={stats.unread === 0}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
                {['all', 'unread', 'orders', 'system', 'promotions'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${filter === f
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'unread' && stats.unread > 0 && (
                            <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {stats.unread}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="p-6 flex gap-4 animate-pulse">
                                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                                </div>
                            </div>
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No notifications found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">We'll let you know when something important happens.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif._id}
                                className={`p-6 flex gap-4 transition-all hover:bg-slate-50/50 group ${!notif.is_read ? 'bg-indigo-50/20' : ''}`}
                            >
                                {getIcon(notif.type)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm ${notif.is_read ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                            {notif.message}
                                        </p>
                                        <button
                                            onClick={() => handleDelete(notif._id)}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-white"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            {new Date(notif.created_at).toLocaleString('vi-VN')}
                                        </span>
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif._id)}
                                                className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {!loading && notifications.length > 0 && (
                <div className="mt-8 text-center text-slate-400 text-xs font-medium">
                    Showing {notifications.length} of {stats.total} notifications
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
