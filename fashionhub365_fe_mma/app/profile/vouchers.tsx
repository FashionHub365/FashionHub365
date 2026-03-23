import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import marketingApi from '../../apis/marketingApi';
import VoucherCard from '../../components/ui/VoucherCard';

export default function VoucherWalletScreen() {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMyVouchers();
    }, []);

    const fetchMyVouchers = async () => {
        try {
            const res = await marketingApi.getMyVouchers();
            if (res && (res as any).success) {
                setVouchers((res as any).data || []);
            }
        } catch (err: any) {
            console.log('Error fetching my vouchers', err.message || err);
            if (err.message === 'No refresh token available') {
                router.replace('/login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyVouchers();
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
                <Text style={styles.headerTitle}>Ví Voucher</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#EE4D2D" size="large" />
                    <Text style={styles.loadingText}>Đang tải Voucher của bạn...</Text>
                </View>
            ) : (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <VoucherCard
                            voucher={item}
                            isClaimed={true}
                            onUse={(code) => {
                                // For now, redirect to Home to use voucher
                                router.push('/(tabs)');
                            }}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EE4D2D" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={80} color="#eee" />
                            <Text style={styles.emptyTitle}>Chưa có mã giảm giá nào</Text>
                            <Text style={styles.emptySub}>Hãy dạo quanh một vòng và nhặt mã ngay nhé!</Text>
                            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/marketing/vouchers' as any)}>
                                <Text style={styles.shopBtnText}>ĐI NHẶT MÃ NGAY</Text>
                            </TouchableOpacity>
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
    shopBtn: {
        marginTop: 30,
        backgroundColor: '#EE4D2D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    shopBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
