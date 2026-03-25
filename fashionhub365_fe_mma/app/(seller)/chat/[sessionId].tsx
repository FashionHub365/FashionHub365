import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    ActivityIndicator, Image, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import chatApi from '../../../apis/chatApi';
import { getStorageItem } from '../../../utils/storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://192.168.1.5:5000';

export default function ChatRoom() {
    const { sessionId } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
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
                        const p = currentSession.user_id?.profile ? {
                            name: currentSession.user_id.profile.full_name || currentSession.user_id.username,
                            avatar: currentSession.user_id.profile.avatar_url
                        } : {
                            name: currentSession.store_id?.name || 'Store',
                            avatar: currentSession.store_id?.avatar
                        };
                        setParticipant(p);
                    }
                }

                // 2. Setup Socket
                const tokensStr = await getStorageItem('tokens');
                const tokens = tokensStr ? JSON.parse(tokensStr) : null;
                const token = tokens?.access?.token;

                if (token) {
                    socketRef.current = io(SOCKET_URL, {
                        auth: { token },
                        transports: ['websocket'],
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
        // The sender is 'me' if item.sender_user_id is NOT the participant's ID
        // (Since participant is the customer and we are the seller)
        const isMe = participant && item.sender_user_id !== participant._id && item.sender_user_id !== participant.id;

        return (
            <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMe && (
                    <View style={styles.miniAvatarPlaceholder}>
                        <Text style={styles.miniAvatarText}>
                            {participant?.name?.charAt(0) || 'U'}
                        </Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.message || item.content}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
                        {item.sent_at ? new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ee4d2d" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {participant?.name || 'Khách hàng'}
                    </Text>
                    <Text style={styles.headerStatus}>Đang trực tuyến</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="call-outline" size={22} color="#111" />
                </TouchableOpacity>
            </View>

            {/* Message List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.inputAction}>
                        <Ionicons name="add-circle-outline" size={28} color="#666" />
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ebebeb',
    },
    backBtn: {
        padding: 4,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
    },
    headerStatus: {
        fontSize: 11,
        color: '#4caf50',
    },
    headerAction: {
        padding: 4,
        marginLeft: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '85%',
    },
    myMessageWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    theirMessageWrapper: {
        alignSelf: 'flex-start',
    },
    miniAvatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    miniAvatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#ee4d2d',
        borderBottomRightRadius: 2,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#ebebeb',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTime: {
        color: '#ee4d2d50',
    },
    theirTime: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ebebeb',
    },
    inputAction: {
        padding: 5,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 8,
        fontSize: 15,
        maxHeight: 100,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ee4d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
    }
});
