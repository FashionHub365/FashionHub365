import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import chatApi from '../../../apis/chatApi';

export default function ChatSessions() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSessions = useCallback(async () => {
        try {
            const res = await chatApi.getMySessions();
            if (res && (res as any).success) {
                const data = (res as any).data || [];
                // Transform data for the UI
                const mappedSessions = data.map((s: any) => ({
                    ...s,
                    participant: s.user_id?.profile ? {
                        name: s.user_id.profile.full_name || s.user_id.username,
                        avatar: s.user_id.profile.avatar_url
                    } : {
                        name: s.store_id?.name || 'Store',
                        avatar: s.store_id?.avatar
                    }
                }));
                setSessions(mappedSessions);
            }
        } catch (err) {
            console.error('Error loading chat sessions:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    const renderSession = ({ item }: { item: any }) => {
        const lastMsg = item.lastMessage || {};
        const unreadCount = item.unreadCount || 0;
        const participant = item.participant || {}; // This should be the Buyer for a Seller session

        return (
            <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => router.push(`/(seller)/chat/${item._id}` as any)}
            >
                <View style={styles.avatarContainer}>
                    {participant.avatar ? (
                        <Image source={{ uri: participant.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarInitial}>
                                {participant.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    {item.isOnline && <View style={styles.onlineStatus} />}
                </View>

                <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                        <Text style={styles.participantName} numberOfLines={1}>
                            {participant.name || 'Người dùng'}
                        </Text>
                        <Text style={styles.timeText}>
                            {lastMsg.sent_at ? new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                    </View>
                    <View style={styles.sessionFooter}>
                        <Text
                            style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {lastMsg.message || 'Chưa có tin nhắn'}
                        </Text>
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tin nhắn khách hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ee4d2d" />
                </View>
            ) : sessions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderSession}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ee4d2d"]} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    backBtn: {
        padding: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 15,
    },
    listContainer: {
        paddingVertical: 10,
    },
    sessionCard: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ee4d2d20',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ee4d2d',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4caf50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 10,
    },
    lastMessageUnread: {
        color: '#111',
        fontWeight: '700',
    },
    unreadBadge: {
        backgroundColor: '#ee4d2d',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    unreadText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
