import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import voucherApi from '../../apis/voucherApi';

export default function SellerVouchers() {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVouchers = useCallback(async () => {
        try {
            const res = await voucherApi.getSellerVouchers();
            // Backend returns { success: true, data: { items: [...], pagination: { ... } } }
            if (res && (res as any).success) {
                const voucherData = (res as any).data?.items || (res as any).data || [];
                setVouchers(Array.isArray(voucherData) ? voucherData : []);
            }
        } catch (err: any) {
            console.error('Error loading vouchers:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách Voucher');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadVouchers();
    }, [loadVouchers]);

    const onRefresh = () => {
        setRefreshing(true);
        loadVouchers();
    };

    const handleDelete = (id: string, code: string) => {
        Alert.alert(
            "Xác nhận xóa",
            `Mã giảm giá "${code}" sẽ bị xóa vĩnh viễn?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await voucherApi.deleteVoucher(id);
                            Alert.alert('Thành công', 'Đã xóa voucher.');
                            loadVouchers();
                        } catch (err: any) {
                            Alert.alert('Lỗi', 'Không thể xóa voucher');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (v: any) => {
        const now = new Date();
        if (new Date(v.ends_at) < now) return '#e74c3c'; // Expired
        if (new Date(v.start_at) > now) return '#f39c12'; // Scheduled
        if (v.usage_count >= v.usage_limit) return '#95a5a6'; // Exhausted
        return '#2ecc71'; // Active
    };

    const getStatusLabel = (v: any) => {
        const now = new Date();
        if (new Date(v.ends_at) < now) return 'Hết hạn';
        if (new Date(v.start_at) > now) return 'Chưa chạy';
        if (v.usage_count >= v.usage_limit) return 'Hết lượt';
        return 'Đang chạy';
    };

    const renderVoucher = ({ item }: { item: any }) => {
        const statusColor = getStatusColor(item);

        return (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                    <View style={styles.mainInfo}>
                        <Text style={styles.voucherCode}>{item.code}</Text>
                        <Text style={styles.voucherName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.discountDesc}>
                            Giảm {item.discount_type === 'percentage' ? `${item.discount_value}%` : `${item.discount_value.toLocaleString('vi-VN')}₫`}
                            {item.min_order_value > 0 && ` (ĐH từ ${item.min_order_value.toLocaleString('vi-VN')}₫)`}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(item)}</Text>
                    </View>
                    <Text style={styles.usageText}>Dùng: {item.usage_count}/{item.usage_limit}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.iconAction}
                            onPress={() => router.push({ pathname: '/(seller)/voucher-form', params: { id: item._id } })}
                        >
                            <Ionicons name="create-outline" size={20} color="#3498db" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconAction}
                            onPress={() => handleDelete(item._id, item.code)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111" />
                    </TouchableOpacity>
                    <View style={styles.titleArea}>
                        <Text style={styles.headerTitle}>Mã giảm giá</Text>
                        <Text style={styles.headerSubtitle}>Tăng doanh số bán hàng</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(seller)/voucher-form')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ee4d2d" />
                </View>
            ) : vouchers.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="ticket-outline" size={64} color="#ddd" />
                    <Text style={styles.emptyText}>Chưa có mã giảm giá nào.</Text>
                    <TouchableOpacity style={styles.createNowBtn} onPress={() => router.push('/(seller)/voucher-form')}>
                        <Text style={styles.createNowText}>Tạo voucher ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderVoucher}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 4,
        marginRight: 10,
    },
    titleArea: {
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#999',
        marginTop: 1,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ee4d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
        marginTop: 15,
        marginBottom: 20,
    },
    createNowBtn: {
        borderWidth: 1,
        borderColor: '#ee4d2d',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    createNowText: {
        color: '#ee4d2d',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardLeft: {
        flex: 1,
        flexDirection: 'row',
        padding: 14,
        borderRightWidth: 1,
        borderRightColor: '#f5f5f5',
        borderStyle: 'dashed',
    },
    statusIndicator: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: 12,
    },
    mainInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    voucherCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ee4d2d',
        letterSpacing: 1,
        marginBottom: 4,
    },
    voucherName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    discountDesc: {
        fontSize: 11,
        color: '#888',
    },
    cardRight: {
        width: 100,
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fcfcfc',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    usageText: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconAction: {
        padding: 4,
        marginHorizontal: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    }
});
