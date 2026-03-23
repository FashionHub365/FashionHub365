import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import listingApi from '../../apis/listingApi';
import { getProductMainImage } from '../../utils/helpers';
import Skeleton from '../ui/Skeleton';

export default function DailyDiscover() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await listingApi.getProducts({ limit: 10, sort: 'newest', page: 1 });
                if (res && (res as any).success) {
                    const fetchedProducts = (res as any).data.products || [];
                    setProducts(fetchedProducts);
                    if (fetchedProducts.length < 10) {
                        setHasMore(false);
                    }
                }
            } catch (error) {
                console.error('Fetch daily discover error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await listingApi.getProducts({ limit: 10, sort: 'newest', page: nextPage });
            if (res && (res as any).success) {
                const newProducts = (res as any).data.products || [];
                if (newProducts.length > 0) {
                    setProducts(prev => [...prev, ...newProducts]);
                    setPage(nextPage);
                }
                if (newProducts.length < 10) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Fetch more error:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const renderProduct = (item: any) => {
        // Generate a random sold count for mock display if not available from backend
        const soldCount = item.sold || Math.floor(Math.random() * 500) + 10;

        return (
            <TouchableOpacity
                key={item._id || item.uuid}
                style={styles.card}
                onPress={() => router.push(`/product/${item._id || item.uuid}` as any)}
                activeOpacity={0.9}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: getProductMainImage(item) }} style={styles.image} />
                    {/* Simulated Badges */}
                    {Math.random() > 0.7 && (
                        <View style={styles.mallBadge}>
                            <Text style={styles.mallText}>Mall</Text>
                        </View>
                    )}
                    {Math.random() > 0.8 && (
                        <View style={styles.favoriteBadge}>
                            <Text style={styles.favoriteText}>Yêu thích</Text>
                        </View>
                    )}
                    {item.discount_percentage > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            <Text style={styles.currency}>₫</Text>
                            {item.base_price?.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={styles.soldText}>Đã bán {soldCount}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Sticky-like Header */}
            <View style={styles.header}>
                <View style={styles.headerIndicator} />
                <Text style={styles.headerTitle}>DÀNH CHO BẠN</Text>
            </View>

            {loading ? (
                <View style={[styles.gridContainer, { marginTop: 15 }]}>
                    <View style={styles.column}>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <View key={`left-${i}`} style={styles.card}>
                                <Skeleton style={styles.image} />
                                <View style={styles.cardInfo}>
                                    <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
                                    <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
                                    <Skeleton width="40%" height={16} />
                                </View>
                            </View>
                        ))}
                    </View>
                    <View style={styles.column}>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <View key={`right-${i}`} style={styles.card}>
                                <Skeleton style={styles.image} />
                                <View style={styles.cardInfo}>
                                    <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
                                    <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
                                    <Skeleton width="40%" height={16} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.gridContainer}>
                    {/* Left Column */}
                    <View style={styles.column}>
                        {products.filter((_, i) => i % 2 === 0).map(renderProduct)}
                    </View>
                    {/* Right Column */}
                    <View style={styles.column}>
                        {products.filter((_, i) => i % 2 !== 0).map(renderProduct)}
                    </View>
                </View>
            )}

            {/* Pagination Footer */}
            {!loading && products.length > 0 && (
                <View style={styles.footer}>
                    {hasMore ? (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <ActivityIndicator size="small" color="#111" />
                            ) : (
                                <Text style={styles.loadMoreText}>Xem thêm</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.endText}>Đã xem hết gợi ý</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ebebeb',
        marginBottom: 4,
        position: 'relative',
    },
    headerIndicator: {
        position: 'absolute',
        bottom: -1,
        width: 60,
        height: 3,
        backgroundColor: '#111',
    },
    headerTitle: {
        color: '#111',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    loader: {
        marginVertical: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    column: {
        flex: 1,
        paddingHorizontal: 4,
    },
    card: {
        backgroundColor: '#fff',
        marginBottom: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f6f6f6',
    },
    mallBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#d0011b',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderBottomRightRadius: 4,
    },
    mallText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    favoriteBadge: {
        position: 'absolute',
        top: 18,
        left: 0,
        backgroundColor: '#ee4d2d',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderBottomRightRadius: 4,
    },
    favoriteText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '600',
    },
    discountBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ffd44d',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    discountText: {
        color: '#ee4d2d',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardInfo: {
        padding: 8,
    },
    name: {
        fontSize: 13,
        color: '#222',
        lineHeight: 18,
        marginBottom: 8,
        height: 36, // Force exactly 2 lines height
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    currency: {
        fontSize: 12,
        color: '#111',
        fontWeight: 'bold',
    },
    price: {
        fontSize: 16,
        color: '#111',
        fontWeight: 'bold',
    },
    soldText: {
        fontSize: 10,
        color: '#888',
    },
    footer: {
        paddingVertical: 25,
        paddingBottom: 40,
        alignItems: 'center',
    },
    loadMoreButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderWidth: 1,
        borderColor: '#111',
        borderRadius: 20,
        backgroundColor: '#fff',
    },
    loadMoreText: {
        fontSize: 13,
        color: '#111',
        fontWeight: '600',
    },
    endText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    }
});
