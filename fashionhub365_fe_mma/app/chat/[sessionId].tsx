import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
    Image, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import chatApi from '../../apis/chatApi';
import { getStorageItem } from '../../utils/storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://192.168.1.5:5000';

export default function BuyerChatRoom() {
    const { sessionId } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [participant, setParticipant] = useState<any>(null);
    const socketRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                // 1. Load History & Session Details
                const [msgRes, sessionsRes] = await Promise.all([
                    chatApi.getMessages(sessionId as string),
                    chatApi.getMySessions()
                ]);

                if (msgRes && (msgRes as any).success) {
                    setMessages((msgRes as any).data || []);
                    // Mark as read
                    await chatApi.markRead(sessionId as string);
                }

                if (sessionsRes && (sessionsRes as any).success) {
                    const sessionList = (sessionsRes as any).data || [];
                    const currentSession = sessionList.find((s: any) => s._id === sessionId);
                    if (currentSession) {
                        const p = {
                            _id: currentSession.store_id?._id || currentSession.store_id,
                            name: currentSession.store_id?.name || 'Cửa hàng',
                            avatar: currentSession.store_id?.avatar_url || currentSession.store_id?.avatar
                        };
                        setParticipant(p);
                    }
                }

                // 2. Setup Socket
                const tokensStr = await getStorageItem('tokens');
                const tokens = tokensStr ? JSON.parse(tokensStr) : null;

                if (tokens?.access?.token) {
                    socketRef.current = io(SOCKET_URL, {
                        auth: { token: tokens.access.token }
                    });

                    socketRef.current.on('connect', () => {
                        console.log('Socket connected');
                        socketRef.current.emit('join_session', { sessionId });
                    });

                    socketRef.current.on('new_message', (message: any) => {
                        if (message.chat_session_id === sessionId) {
                            setMessages(prev => [message, ...prev]);
                        }
                    });

                    socketRef.current.on('error', (error: any) => {
                        console.error('Socket error:', error);
                    });
                }
            } catch (err) {
                console.error('Error init chat:', err);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            initChat();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [sessionId]);

    const sendMessage = async () => {
        if (!inputText.trim() || !socketRef.current) return;

        const userStr = await getStorageItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user || (!user._id && !user.id)) {
            console.error('User not found in storage');
            return;
        }

        const messageData = {
            sessionId,
            message: inputText.trim(),
            senderUserId: user._id || user.id
        };

        socketRef.current.emit('send_message', messageData);
        setInputText('');
        Keyboard.dismiss();
    };

    const renderMessage = ({ item }: { item: any }) => {
        // As a Buyer, I am 'me' if sender_user_id is NOT the store/seller's participant ID
        // Or more simply, if I am the sender.
        const isMe = participant && item.sender_user_id !== participant._id;

        return (
            <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMe && (
                    <View style={styles.miniAvatarPlaceholder}>
                        <Text style={styles.miniAvatarText}>
                            {participant?.name?.charAt(0) || 'S'}
                        </Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
                        {item.sent_at ? new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{participant?.name || 'Đang tải...'}</Text>
                    <Text style={styles.headerStatus}>Trực tuyến</Text>
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ee4d2d" />
                </View>
            ) : (
                <>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item._id || item.uuid || Math.random().toString()}
                        inverted
                        contentContainerStyle={styles.messagesContainer}
                        showsVerticalScrollIndicator={false}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    >
                        <View style={styles.inputContainer}>
                            <TouchableOpacity style={styles.attachBtn}>
                                <Ionicons name="add" size={24} color="#666" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tin nhắn..."
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                                onPress={sendMessage}
                                disabled={!inputText.trim()}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </>
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
    },
    headerStatus: {
        fontSize: 12,
        color: '#2ecc71',
    },
    moreBtn: {
        padding: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    myMessageWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    theirMessageWrapper: {
        alignSelf: 'flex-start',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    miniAvatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    miniAvatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#ee4d2d',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#f1f1f1',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#111',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTime: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    attachBtn: {
        padding: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        fontSize: 15,
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ee4d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
    },
});
