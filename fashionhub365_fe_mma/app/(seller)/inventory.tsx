import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Image, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import inventoryApi from '../../apis/inventoryApi';
import { getProductMainImage } from '../../utils/helpers';
import * as Haptics from 'expo-haptics';

export default function SellerInventory() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

    // Modal for Restock
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [adjustment, setAdjustment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadInventory = useCallback(async () => {
        try {
            const res = await inventoryApi.getInventory({ limit: 100 });
            // @ts-ignore
            if (res && res.success) {
                // @ts-ignore
                setInventory(res.data.items || []);
            }
        } catch (err) {
            console.error('Error loading inventory:', err);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu kho hàng');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const onRefresh = () => {
        setRefreshing(true);
        loadInventory();
    };

    const handleRestock = async () => {
        if (!selectedItem || !adjustment) return;
        const num = parseInt(adjustment);
        if (isNaN(num) || num <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
            return;
        }

        setSubmitting(true);
        try {
            // @ts-ignore
            const res = await inventoryApi.adjustInventory(selectedItem._id, num);
            // @ts-ignore
            if (res && res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowRestockModal(false);
                setAdjustment('');
                loadInventory();
                Alert.alert('Thành công', 'Đã cập nhật số lượng tồn kho');
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể cập nhật kho hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return { label: 'Hết hàng', color: '#e74c3c', bg: '#fdf2f2' };
        if (qty <= 10) return { label: 'Sắp hết', color: '#e67e22', bg: '#fef5ed' };
        return { label: 'Đủ hàng', color: '#27ae60', bg: '#f0f9f4' };
    };

    const filteredData = inventory.filter(item => {
        const matchesSearch = item.product_id?.name?.toLowerCase().includes(search.toLowerCase());
        const qty = item.quantity || 0;
        if (filter === 'low') return matchesSearch && qty > 0 && qty <= 10;
        if (filter === 'out') return matchesSearch && qty <= 0;
        return matchesSearch;
    });

    const renderItem = ({ item }: { item: any }) => {
        const product = item.product_id;
        const qty = item.quantity || 0;
        const status = getStockStatus(qty);
        const variantId = item.variant_id;
        const variant = product?.variants?.find((v: any) => v._id === variantId);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Image source={{ uri: getProductMainImage(product) }} style={styles.productThumb} />
                    <View style={styles.productMeta}>
                        <Text style={styles.productName} numberOfLines={1}>{product?.name || 'Sản phẩm'}</Text>
                        <View style={styles.variantRow}>
                            {variant && (
                                <Text style={styles.variantText}>
                                    {variant.attributes?.color ? `Màu: ${variant.attributes.color}` : ''}
                                    {variant.attributes?.size ? ` - Size: ${variant.attributes.size}` : ''}
                                </Text>
                            )}
                            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.qtyContainer}>
                        <Text style={styles.qtyLabel}>Tồn kho thực tế</Text>
                        <Text style={[styles.qtyValue, { color: status.color }]}>{qty}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.restockBtn}
                        onPress={() => {
                            setSelectedItem(item);
                            setShowRestockModal(true);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#ee4d2d" />
                        <Text style={styles.restockBtnText}>Nhập hàng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kho Hàng (Warehouse)</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Tìm theo tên sản phẩm..."
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, filter === 'low' && styles.filterBtnActive]}
                        onPress={() => setFilter('low')}
                    >
                        <Text style={[styles.filterText, filter === 'low' && styles.filterTextActive]}>Sắp hết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, filter === 'out' && styles.filterBtnActive]}
                        onPress={() => setFilter('out')}
                    >
                        <Text style={[styles.filterText, filter === 'out' && styles.filterTextActive]}>Hết hàng</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 40 }} color="#ee4d2d" size="large" />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={64} color="#ddd" />
                            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
                        </View>
                    }
                />
            )}

            {/* Restock Modal */}
            <Modal visible={showRestockModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nhập hàng thêm</Text>
                        <Text style={styles.itemRef}>
                            Sản phẩm: {selectedItem?.product_id?.name}
                        </Text>

                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                placeholder="Nhập số lượng nhập thêm..."
                                value={adjustment}
                                onChangeText={setAdjustment}
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setShowRestockModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={handleRestock}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Xác nhận</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#fff',
        gap: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    filterBtnActive: {
        backgroundColor: '#ee4d2d',
    },
    filterText: {
        fontSize: 13,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    productThumb: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    productMeta: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    variantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    variantText: {
        fontSize: 12,
        color: '#888',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f9f9f9',
    },
    qtyContainer: {
        gap: 4,
    },
    qtyLabel: {
        fontSize: 12,
        color: '#999',
    },
    qtyValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    restockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ee4d2d',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    restockBtnText: {
        color: '#ee4d2d',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        color: '#999',
        fontSize: 15,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    itemRef: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputWrap: {
        marginBottom: 24,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#f5f5f5',
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: '600',
    },
    confirmBtn: {
        backgroundColor: '#ee4d2d',
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
