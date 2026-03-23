import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import checkoutApi from '../../apis/checkoutApi';

const STATUS_CONFIG: any = {
    created: { label: 'Chờ xác nhận', color: '#f39c12', icon: 'time-outline' },
    pending_payment: { label: 'Chờ thanh toán', color: '#e67e22', icon: 'wallet-outline' },
    processing: { label: 'Đang xử lý', color: '#3498db', icon: 'cube-outline' },
    shipping: { label: 'Đang giao hàng', color: '#9b59b6', icon: 'car-outline' },
    delivered: { label: 'Đã giao hàng', color: '#2ecc71', icon: 'checkmark-done-outline' },
    cancelled: { label: 'Đã huỷ', color: '#e74c3c', icon: 'close-circle-outline' },
    return_requested: { label: 'Yêu cầu trả hàng', color: '#e74c3c', icon: 'refresh-circle-outline' },
    returned: { label: 'Đã trả hàng', color: '#7f8c8d', icon: 'arrow-undo-outline' },
};

const PAYMENT_METHOD_MAP: any = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    vnpay: 'Thanh toán VNPay',
};

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        if (id) fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const res = await checkoutApi.getOrderById(id as string);
            if ((res as any).success) {
                setOrder((res as any).data);
            }
        } catch (err) {
            console.log('Error fetching order', err);
            Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Huỷ đơn hàng',
            'Bạn có chắc chắn muốn huỷ đơn hàng này không?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Có, Huỷ đơn',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelLoading(true);
                        try {
                            await checkoutApi.cancelOrder(order.id || order._id);
                            Alert.alert('Thành công', 'Đã huỷ đơn hàng');
                            fetchOrderDetail();
                        } catch (err: any) {
                            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể huỷ đơn hàng');
                        } finally {
                            setCancelLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#111" />
            </View>
        );
    }

    if (!order) return null;

    const currentStatus = STATUS_CONFIG[order.status] || { label: order.status, color: '#888', icon: 'information-circle' };
    const canCancel = ['created', 'pending_payment'].includes(order.status);
    const address = order.shipping_address || {};

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi Tiết Đơn Hàng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: currentStatus.color }]}>
                    <Ionicons name={currentStatus.icon} size={32} color="#fff" style={{ marginRight: 15 }} />
                    <View>
                        <Text style={styles.statusLabel}>{currentStatus.label}</Text>
                        <Text style={styles.statusSub}>Mã đơn: {order.uuid || order.id?.substring(0, 8)}</Text>
                    </View>
                </View>

                {/* Shipping Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location" size={20} color="#e74c3c" />
                        <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
                    </View>
                    <View style={styles.addressBox}>
                        <Text style={styles.addressName}>{address.full_name || address.fullName}</Text>
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                        <Text style={styles.addressText}>{address.line1 || address.street || address.address}</Text>
                        {(address.ward || address.district || address.city) && (
                            <Text style={styles.addressText}>
                                {[address.ward, address.district, address.city].filter(Boolean).join(', ')}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.storeHeader}>
                        <Ionicons name="storefront" size={18} color="#666" />
                        <Text style={styles.storeName}>{order.store_name}</Text>
                        <TouchableOpacity style={styles.visitStoreBtn} onPress={() => router.push(`/store/${order.store_id || order.store_uuid}`)}>
                            <Text style={styles.visitStoreText}>Xem Shop</Text>
                        </TouchableOpacity>
                    </View>

                    {order.items?.map((item: any, index: number) => {
                        const imageUrl = item.snapshot?.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80';
                        return (
                            <View key={index} style={styles.itemRow}>
                                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.snapshot?.name || 'Sản phẩm'}</Text>
                                    <Text style={styles.itemVariant}>Phân loại: {item.snapshot?.variantName || 'Mặc định'}</Text>
                                    <View style={styles.itemPriceRow}>
                                        <Text style={styles.itemPrice}>{(item.price || 0).toLocaleString('vi-VN')}₫</Text>
                                        <Text style={styles.itemQty}>x{item.qty || item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Payment & Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitleBlack}>Chi tiết thanh toán</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tiền hàng</Text>
                        <Text style={styles.summaryValue}>
                            {((order.total_amount || 0) - (order.shipping_fee || 0) + (order.discount_total || 0)).toLocaleString('vi-VN')}₫
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                        <Text style={styles.summaryValue}>{(order.shipping_fee || 0).toLocaleString('vi-VN')}₫</Text>
                    </View>
                    {(order.discount_total || 0) > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Voucher giảm giá</Text>
                            <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>-{(order.discount_total || 0).toLocaleString('vi-VN')}₫</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' }]}>
                        <Text style={styles.summaryLabelTotal}>Tổng thanh toán</Text>
                        <Text style={styles.summaryValueTotal}>{(order.total_amount || 0).toLocaleString('vi-VN')}₫</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phương thức thanh toán</Text>
                        <Text style={styles.infoValue}>{PAYMENT_METHOD_MAP[order.payment_method] || order.payment_method}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái thanh toán</Text>
                        <Text style={[styles.infoValue, { color: order.payment_status === 'paid' ? '#2ecc71' : '#e67e22', fontWeight: 'bold' }]}>
                            {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Thời gian đặt hàng</Text>
                        <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleString('vi-VN')}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.supportBtn}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#111" />
                    <Text style={styles.supportText}>Liên hệ Cửa Hàng</Text>
                </TouchableOpacity>

                {canCancel && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, cancelLoading && { opacity: 0.7 }]}
                        onPress={handleCancelOrder}
                        disabled={cancelLoading}
                    >
                        {cancelLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.cancelText}>Huỷ Đơn Hàng</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    scrollContent: { paddingBottom: 30 },

    statusBanner: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, paddingVertical: 24,
    },
    statusLabel: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    statusSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    section: {
        backgroundColor: '#fff',
        marginTop: 10,
        padding: 16,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginLeft: 8 },
    sectionTitleBlack: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 15 },

    addressBox: { paddingLeft: 28 },
    addressName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
    addressPhone: { fontSize: 14, color: '#666', marginBottom: 4 },
    addressText: { fontSize: 14, color: '#666', lineHeight: 20 },

    storeHeader: {
        flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12,
    },
    storeName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 8 },
    visitStoreBtn: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    visitStoreText: { fontSize: 12, color: '#555', fontWeight: '500' },

    itemRow: { flexDirection: 'row', marginBottom: 15 },
    itemImage: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#f9f9f9' },
    itemDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    itemName: { fontSize: 14, color: '#333', fontWeight: '500', lineHeight: 20 },
    itemVariant: { fontSize: 13, color: '#888', marginTop: 4 },
    itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    itemPrice: { fontSize: 15, fontWeight: '700', color: '#111' },
    itemQty: { fontSize: 13, color: '#666' },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: '#666' },
    summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
    summaryLabelTotal: { fontSize: 16, color: '#111', fontWeight: '700' },
    summaryValueTotal: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { fontSize: 13, color: '#888' },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },

    footer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f0f0f0',
        padding: 12, paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 12,
    },
    supportBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 12,
    },
    supportText: { fontSize: 14, fontWeight: '600', color: '#111' },
    cancelBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 8, paddingVertical: 12,
        borderWidth: 1, borderColor: '#e74c3c'
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#e74c3c' }
});
