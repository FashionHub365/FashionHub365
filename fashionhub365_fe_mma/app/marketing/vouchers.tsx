import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import marketingApi from '../../apis/marketingApi';
import VoucherCard from '../../components/ui/VoucherCard';

export default function VoucherCollectionScreen() {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAllVouchers();
    }, []);

    const fetchAllVouchers = async () => {
        try {
            // Get all active vouchers
            const res = await marketingApi.getVouchers({ status: 'active' });
            if (res && (res as any).success) {
                setVouchers((res as any).data?.items || []);
            }
        } catch (err) {
            console.log('Error fetching vouchers', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleClaimVoucher = async (voucherId: string) => {
        try {
            const res = await marketingApi.claimVoucher(voucherId);
            if (res && (res as any).success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Thành công', 'Voucher đã được lưu vào ví của bạn!');
                // Update local state to reflect claimed status
                setVouchers(prev => prev.map(v => v._id === voucherId ? { ...v, isClaimed: true } : v));
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể lấy voucher. Vui lòng đăng nhập.';
            if (msg.includes('authenticate')) {
                Alert.alert('Thông báo', 'Vui lòng đăng nhập để lưu mã giảm giá.', [
                    { text: 'Để sau', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => router.push('/login' as any) }
                ]);
            } else {
                Alert.alert('Thông báo', msg);
            }
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAllVouchers();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trạm Voucher</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#EE4D2D" size="large" />
                    <Text style={styles.loadingText}>Đang săn tìm Voucher giá tốt...</Text>
                </View>
            ) : (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <VoucherCard
                            voucher={item}
                            isClaimed={item.isClaimed}
                            onClaim={handleClaimVoucher}
                            onUse={() => router.push('/(tabs)')}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EE4D2D" />
                    }
                    ListHeaderComponent={
                        <View style={styles.banner}>
                            <Ionicons name="gift-outline" size={32} color="#EE4D2D" />
                            <View style={styles.bannerText}>
                                <Text style={styles.bannerTitle}>Siêu Hội Voucher</Text>
                                <Text style={styles.bannerSub}>Săn mã HOT ngay, mua sắm thả ga!</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={80} color="#eee" />
                            <Text style={styles.emptyTitle}>Hiện chưa có mã mới</Text>
                            <Text style={styles.emptySub}>Voucher sẽ sớm quay lại, theo dõi thêm nhé!</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF2EE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFD8CC',
    },
    bannerText: {
        marginLeft: 12,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EE4D2D',
    },
    bannerSub: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#888',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
