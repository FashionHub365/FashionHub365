import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import adminApi from '../../apis/adminApi';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchLogs = async (pageNumber = 1, reset = false) => {
        try {
            setLoading(pageNumber === 1);
            const res = await adminApi.getAuditLogs({ page: pageNumber, limit: 15 });
            const data = (res as any).data;

            const newLogs = Array.isArray(data) ? data : (data?.logs || []);

            if (reset) {
                setLogs(newLogs);
            } else {
                setLogs(prev => [...prev, ...newLogs]);
            }

            // Check if more
            if (data?.pagination) {
                setHasMore(data.pagination.page < data.pagination.totalPages);
            } else {
                // Simple fallback if no explicit pagination info
                setHasMore(newLogs.length === 15);
            }

            setPage(pageNumber);
        } catch (err) {
            console.error('Fetch logs error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1, true);
    }, []);

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            fetchLogs(page + 1);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getActionColor = (action: string) => {
        const actionUpper = action?.toUpperCase() || '';
        if (actionUpper.includes('CREATE') || actionUpper.includes('APPROVE') || actionUpper.includes('LOGIN')) return '#4caf50';
        if (actionUpper.includes('DELETE') || actionUpper.includes('REJECT') || actionUpper.includes('BAN')) return '#f44336';
        if (actionUpper.includes('UPDATE') || actionUpper.includes('EDIT')) return '#ff9800';
        return '#4a90e2';
    };

    const renderLog = ({ item }: { item: any }) => (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <View style={styles.logAction}>
                    <View style={[styles.actionDot, { backgroundColor: getActionColor(item.action) }]} />
                    <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>{item.action}</Text>
                </View>
                <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
            </View>

            <View style={styles.logContent}>
                <Text style={styles.messageText}>
                    <Text style={styles.boldText}>{item.admin_id?.username || item.admin_id?.email || 'Admin'}</Text>
                    {' '} đã thực hiện: {item.target}
                </Text>

                {item.reason && (
                    <View style={styles.reasonContainer}>
                        <Text style={styles.reasonLabel}>Lý do:</Text>
                        <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
                )}

                <View style={styles.metaContainer}>
                    <Text style={styles.metaText}>IP: {item.ip_address || 'N/A'}</Text>
                    {item.entity_type && <Text style={styles.metaText}> • Entity: {item.entity_type}</Text>}
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color="#333" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Nhật ký hệ thống</Text>
                    <Text style={styles.headerSubtitle}>Hoạt động gần đây</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading && page === 1 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                </View>
            ) : logs.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="document-text-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có log nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item, index) => item._id || String(index)}
                    renderItem={renderLog}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        hasMore ? <ActivityIndicator style={{ marginVertical: 15 }} color="#4a90e2" /> : null
                    }
                    onRefresh={() => fetchLogs(1, true)}
                    refreshing={loading && page === 1}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 2,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 15,
        fontSize: 15,
        color: '#888',
    },
    listContainer: {
        padding: 16,
    },
    logCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
    },
    logAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    actionText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 11,
        color: '#888',
    },
    logContent: {
        marginTop: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    reasonContainer: {
        marginTop: 10,
        backgroundColor: '#fff3e0',
        padding: 10,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#ff9800',
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 13,
        color: '#555',
    },
    metaContainer: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 8,
    },
    metaText: {
        fontSize: 11,
        color: '#aaa',
        fontFamily: 'monospace',
    }
});
