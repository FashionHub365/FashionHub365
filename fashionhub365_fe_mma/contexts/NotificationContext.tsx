import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationApi from '../apis/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const refreshUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        try {
            const res = await notificationApi.getUnreadCount();
            if (res && typeof res === 'number') {
                setUnreadCount(res);
            } else if (res && (res as any).data !== undefined) {
                setUnreadCount((res as any).data);
            }
        } catch (error) {
            console.error('Fetch unread count error:', error);
        }
    }, [user]);

    useEffect(() => {
        refreshUnreadCount();

        // Optional: Poll every 1 minute
        const interval = setInterval(refreshUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, loading }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
