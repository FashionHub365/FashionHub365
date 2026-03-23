import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import checkoutApi from '../../apis/checkoutApi';

const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã huỷ' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending_confirmation: { bg: '#FFF8E1', text: '#F9A825', label: 'Chờ xác nhận' },
    confirmed: { bg: '#E3F2FD', text: '#1565C0', label: 'Đã xác nhận' },
    processing: { bg: '#E8F5E9', text: '#2E7D32', label: 'Đang xử lý' },
    shipping: { bg: '#E3F2FD', text: '#1565C0', label: 'Đang giao' },
    delivered: { bg: '#E8F5E9', text: '#2E7D32', label: 'Đã giao' },
    cancelled: { bg: '#FFEBEE', text: '#C62828', label: 'Đã huỷ' },
    returned: { bg: '#FFF3E0', text: '#E65100', label: 'Hoàn trả' },
};

export default function OrderHistoryScreen() {
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const params: any = {};
            if (activeTab !== 'all') params.status = activeTab;
            const res = await checkoutApi.getMyOrders(params);
            if ((res as any)?.success) {
                setOrders((res as any).data || []);
            }
        } catch (err) {
            console.log('Fetch orders error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setLoading(true);
        fetchOrders();
    }, [fetchOrders]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusInfo = (status: string) => {
        return STATUS_COLORS[status] || { bg: '#f5f5f5', text: '#666', label: status };
    };

    const renderOrder = ({ item }: { item: any }) => {
        const statusInfo = getStatusInfo(item.status);
        const totalItems = item.sub_orders?.reduce((sum: number, sub: any) =>
            sum + (sub.items?.length || 0), 0) || item.items?.length || 0;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/orders/${item.uuid || item._id}` as any)}
            >
                <View style={styles.orderHeader}>
                    <Text style={styles.orderIdText}>#{item.uuid?.slice(-8) || item._id?.slice(-8)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                    </View>
                </View>

                <View style={styles.orderBody}>
                    <View style={styles.orderInfoRow}>
                        <Ionicons name="cube-outline" size={16} color="#888" />
                        <Text style={styles.orderInfoText}>{totalItems} sản phẩm</Text>
                    </View>
                    <View style={styles.orderInfoRow}>
                        <Ionicons name="time-outline" size={16} color="#888" />
                        <Text style={styles.orderInfoText}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>
                        {(item.total_amount || 0).toLocaleString('vi-VN')}₫
                    </Text>
                    {item.status === 'pending_confirmation' && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancelOrder(item._id)}
                        >
                            <Text style={styles.cancelBtnText}>Huỷ đơn</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            const res = await checkoutApi.cancelOrder(orderId);
            if ((res as any)?.success) {
                fetchOrders();
            }
        } catch (err: any) {
            console.log('Cancel error:', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={TABS}
                    keyExtractor={(t) => t.key}
                    style={{ flexGrow: 0, maxHeight: 70 }}
                    contentContainerStyle={styles.tabsContainer}
                    renderItem={({ item: tab }) => (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Orders List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="receipt-outline" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
                        <Text style={styles.shopBtnText}>Mua sắm ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrder}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                />
            )
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    tabsContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', alignItems: 'center' },
    tab: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#f5f5f5', marginRight: 8,
        justifyContent: 'center', alignItems: 'center', height: 36,
    },
    tabActive: { backgroundColor: '#111' },
    tabText: { fontSize: 13, fontWeight: '500', color: '#666' },
    tabTextActive: { color: '#fff', fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyText: { fontSize: 15, color: '#888', marginTop: 16, marginBottom: 20 },
    shopBtn: { backgroundColor: '#111', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    orderCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0',
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderIdText: { fontSize: 14, fontWeight: '700', color: '#111' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },

    orderBody: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    orderInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderInfoText: { fontSize: 13, color: '#666' },

    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 12 },
    orderTotal: { fontSize: 16, fontWeight: '800', color: '#111' },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
});
