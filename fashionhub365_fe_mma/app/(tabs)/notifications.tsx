import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import notificationApi from '../../apis/notificationApi';

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

interface NotificationItem {
    _id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { refreshUnreadCount } = useNotification();

    const fetchNotifications = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await notificationApi.getNotifications({ limit: 50 });
            if (res && (res as any).success) {
                setNotifications((res as any).data.items || []);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(item => (item._id === id ? { ...item, is_read: true } : item))
            );
            refreshUnreadCount();
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
            refreshUnreadCount();
        } catch (error) {
            console.error('Mark all as read error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationApi.deleteNotification(id);
            setNotifications(prev => prev.filter(item => item._id !== id));
            refreshUnreadCount();
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'order':
                return { name: 'cart-outline', color: '#E67E22' };
            case 'promo':
                return { name: 'gift-outline', color: '#E74C3C' };
            case 'system':
                return { name: 'settings-outline', color: '#34495E' };
            default:
                return { name: 'notifications-outline', color: '#3498DB' };
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        const icon = getIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.itemContainer, !item.is_read && styles.unreadItem]}
                onPress={() => !item.is_read && handleMarkAsRead(item._id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '10' }]}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.message, !item.is_read && styles.unreadText]}>
                        {item.message}
                    </Text>
                    <Text style={styles.time}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#999" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {notifications.some(n => !n.is_read) && (
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={styles.markAll}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#111" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Không có thông báo nào</Text>
                        </View>
                    }
                    contentContainerStyle={notifications.length === 0 && { flex: 1 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
    },
    markAll: {
        fontSize: 14,
        color: '#0066FF',
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: '#F0F7FF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    message: {
        fontSize: 15,
        color: '#444',
        lineHeight: 20,
    },
    unreadText: {
        color: '#111',
        fontWeight: '600',
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
});
