import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, StatusBar, Dimensions } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import listingApi from '../../apis/listingApi';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 2 - 20;

export default function CategoryProductsScreen() {
    const { id } = useLocalSearchParams();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState('Sản Phẩm');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories to find the name
                const catRes = await listingApi.getCategories();
                if (catRes && (catRes as any).success) {
                    const matchedCat = (catRes as any).data.find((c: any) => String(c._id) === String(id) || String(c.id) === String(id));
                    if (matchedCat) {
                        setCategoryName(matchedCat.name || matchedCat.title || 'Sản Phẩm');
                    }
                }

                // Fetch products
                const prodRes = await listingApi.getProducts({ category: id });
                if (prodRes && (prodRes as any).success) {
                    const data = (prodRes as any).data?.products || (prodRes as any).data?.docs || (prodRes as any).data || [];
                    setProducts(data);
                }
            } catch (error) {
                console.error("Error fetching category products:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const renderProduct = ({ item }: { item: any }) => {
        const imageUrl = item.media && item.media.length > 0 ? item.media[0].url : (item.images && item.images.length > 0 ? item.images[0].url : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80');

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${item._id || item.slug}` as any)}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    {item.oldPrice && item.oldPrice > item.base_price && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                -{Math.round((1 - (item.base_price || item.price) / item.oldPrice) * 100)}%
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productBrand} numberOfLines={1}>{item.brand_id?.name || 'FashionHub'}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>{(item.base_price || item.price)?.toLocaleString('vi-VN')}₫</Text>
                    </View>
                    <View style={styles.metaContainer}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#FFB800" />
                            <Text style={styles.ratingText}>{item.rating?.average || 5.0}</Text>
                        </View>
                        <Text style={styles.productSold}>Đã bán {item.sold_count || 0}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Premium Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.push('/(tabs)/cart')}>
                    <Ionicons name="bag-outline" size={22} color="#111" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    {/* Simulated Skeleton items for a premium feel */}
                    {[1, 2, 3, 4].map(idx => (
                        <View key={idx} style={[styles.productCard, { backgroundColor: '#f9f9f9' }]}>
                            <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
                            <View style={{ padding: 12 }}>
                                <View style={{ height: 12, backgroundColor: '#eee', borderRadius: 4, width: '40%', marginBottom: 10 }} />
                                <View style={{ height: 16, backgroundColor: '#eee', borderRadius: 4, width: '90%', marginBottom: 8 }} />
                                <View style={{ height: 16, backgroundColor: '#eee', borderRadius: 4, width: '50%' }} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : products.length === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="search-outline" size={48} color="#ccc" />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có sản phẩm</Text>
                    <Text style={styles.emptyText}>Hiện chưa có sản phẩm nào thuộc danh mục {categoryName.toLowerCase()}. Vui lòng quay lại sau.</Text>
                    <TouchableOpacity style={styles.shopNowButton} onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={styles.shopNowText}>Khám phá ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item, index) => item._id?.toString() || index.toString()}
                    renderItem={renderProduct}
                    numColumns={2}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fcfcfc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 10,
        backgroundColor: '#fff',
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        flex: 1,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 15,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fcfcfc',
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    shopNowButton: {
        backgroundColor: '#111',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 30,
    },
    shopNowText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 15,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    productCard: {
        width: ITEM_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: ITEM_WIDTH * 1.2,
        backgroundColor: '#f8f8f8',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 12,
    },
    productBrand: {
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    productName: {
        fontSize: 13,
        color: '#111',
        fontWeight: '500',
        marginBottom: 8,
        lineHeight: 18,
        height: 36,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 11,
        color: '#555',
        marginLeft: 4,
        fontWeight: '500',
    },
    productSold: {
        fontSize: 11,
        color: '#888',
    }
});
