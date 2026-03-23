import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import wishlistApi from '../../apis/wishlistApi';

export default function WishlistScreen() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlist = useCallback(async () => {
        try {
            const res = await wishlistApi.getWishlist(1, 50);
            if (res?.success) {
                setItems(res.data?.items || res.data || []);
            }
        } catch (err) {
            console.log('Wishlist error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const handleRemove = async (productId: string) => {
        try {
            await wishlistApi.removeFromWishlist(productId);
            setItems(prev => prev.filter(i => (i.product_id?._id || i._id) !== productId));
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể xoá sản phẩm khỏi danh sách yêu thích.');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const product = item.product_id || item;
        const imageUrl = product.media?.[0]?.url || 'https://via.placeholder.com/150';
        const price = product.base_price || 0;

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/product/${product._id}` as any)}
            >
                <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(product._id)}
                >
                    <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productPrice}>{price.toLocaleString('vi-VN')}₫</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yêu thích ({items.length})</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="heart-outline" size={64} color="#ddd" />
                    <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
                    <Text style={styles.emptySub}>Hãy thêm sản phẩm bạn yêu thích để xem lại sau</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
                        <Text style={styles.shopBtnText}>Khám phá ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, i) => item._id || i.toString()}
                    renderItem={renderItem}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={{ padding: 12 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWishlist(); }} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
    shopBtn: { backgroundColor: '#111', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    row: { justifyContent: 'space-between' },
    productCard: {
        width: '48%', backgroundColor: '#fff', borderRadius: 12,
        marginBottom: 14, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden',
    },
    productImage: { width: '100%', height: 180, backgroundColor: '#f5f5f5' },
    removeBtn: {
        position: 'absolute', top: 8, right: 8, width: 28, height: 28,
        borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center', alignItems: 'center',
    },
    productInfo: { padding: 10 },
    productName: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 6, lineHeight: 18 },
    productPrice: { fontSize: 15, fontWeight: '800', color: '#111' },
});
