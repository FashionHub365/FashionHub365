import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import chatApi from '../../apis/chatApi';

export default function BuyerChatList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSessions = useCallback(async () => {
        try {
            const res = await chatApi.getMySessions();
            if (res && (res as any).success) {
                // For buyers, we want to show the STORE as the participant
                const data = (res as any).data || [];
                const mappedSessions = data.map((s: any) => ({
                    ...s,
                    participant: {
                        name: s.store_id?.name || 'Cửa hàng',
                        avatar: s.store_id?.avatar_url || s.store_id?.avatar
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
        const participant = item.participant || {};

        return (
            <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => router.push(`/chat/${item._id}` as any)}
            >
                <View style={styles.avatarContainer}>
                    {participant.avatar ? (
                        <Image source={{ uri: participant.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarInitial}>
                                {participant.name?.charAt(0).toUpperCase() || 'S'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                        <Text style={styles.participantName} numberOfLines={1}>
                            {participant.name}
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
                                <Text style={styles.unreadText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ee4d2d" />
                </View>
            ) : sessions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
                    <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào.</Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderSession}
                    contentContainerStyle={styles.listContent}
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
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    exploreBtn: {
        marginTop: 20,
        backgroundColor: '#ee4d2d',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        paddingVertical: 8,
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
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f5f5f5',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#888',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        paddingBottom: 12,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
        flex: 1,
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
        marginRight: 8,
    },
    lastMessageUnread: {
        color: '#111',
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: '#ee4d2d',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
