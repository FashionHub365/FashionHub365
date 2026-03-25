import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import adminApi from '../../apis/adminApi';

export default function AdminProductManagement() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchProducts = async (pageNum = 1, isRefresh = false) => {
        try {
            if (!isRefresh && pageNum === 1) setLoading(true);

            const res = await adminApi.getAdminProducts({
                page: pageNum,
                limit: 20,
                search,
                adminMode: true
            });

            if ((res as any).success) {
                const data = (res as any).data;
                const newProducts = data.products || [];

                if (isRefresh || pageNum === 1) {
                    setProducts(newProducts);
                } else {
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p._id));
                        const filteredNew = newProducts.filter((p: any) => !existingIds.has(p._id));
                        return [...prev, ...filteredNew];
                    });
                }

                setHasMore(newProducts.length === 20 && pageNum < (data.totalPages || 1));
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Fetch admin products error:', error);
            Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts(1, true);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts(1, true);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading && !refreshing) {
            fetchProducts(page + 1);
        }
    };

    const renderProduct = ({ item }: { item: any }) => {
        const primaryImage = item.media?.find((m: any) => m.isPrimary)?.url || item.media?.[0]?.url;
        const status = item.status?.toUpperCase() || 'ACTIVE';

        return (
            <View style={styles.productCard}>
                <View style={styles.productImgContainer}>
                    {primaryImage ? (
                        <Image source={{ uri: primaryImage }} style={styles.productImg} />
                    ) : (
                        <View style={styles.imgPlaceholder}>
                            <Ionicons name="image-outline" size={24} color="#ccc" />
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.storeName}>Cửa hàng: {item.store_id?.name || 'N/A'}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>{item.base_price?.toLocaleString('vi-VN')} ₫</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status === 'ACTIVE' ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={[styles.statusText, { color: status === 'ACTIVE' ? '#34a853' : '#d93025' }]}>
                                {status === 'ACTIVE' ? 'Đang bán' : 'Bị ẩn'}
                            </Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.detailBtn} onPress={() => router.push(`/product/${item._id}`)}>
                    <Ionicons name="chevron-forward" size={20} color="#888" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý sản phẩm</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm sản phẩm, cửa hàng..."
                    value={search}
                    onChangeText={setSearch}
                />
                {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#ccc" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && page === 1 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.listContent}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shirt-outline" size={64} color="#ddd" />
                            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào.</Text>
                        </View>
                    }
                    ListFooterComponent={hasMore ? <ActivityIndicator style={{ margin: 20 }} color="#1a73e8" /> : null}
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
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    backBtn: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    productCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    productImgContainer: {
        marginRight: 12,
    },
    productImg: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    imgPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        lineHeight: 18,
    },
    storeName: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        justifyContent: 'space-between',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#d93025',
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
    detailBtn: {
        padding: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#888',
        fontSize: 14,
    },
});
