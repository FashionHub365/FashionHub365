import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';

import marketingApi from '../../apis/marketingApi';
import { getProductMainImage } from '../../utils/helpers';

export default function FlashSaleSection() {
    const [flashSale, setFlashSale] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await marketingApi.getActiveFlashSales();
                if (res && (res as any).success && (res as any).data.length > 0) {
                    const activeSale = (res as any).data[0];
                    setFlashSale(activeSale);
                    setItems(activeSale.items || []);
                }
            } catch (error) {
                console.error('Fetch flash sale error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashSale();
    }, []);

    useEffect(() => {
        if (!flashSale || !flashSale.ends_at) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const end = new Date(flashSale.ends_at);
            const diff = end.getTime() - now.getTime();

            if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [flashSale]);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={60} height={16} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.card}>
                            <Skeleton width={120} height={120} borderRadius={6} />
                            <Skeleton width={80} height={16} style={{ marginTop: 10, marginBottom: 8 }} />
                            <Skeleton width={100} height={16} borderRadius={8} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (items.length === 0) return null;

    const renderItem = ({ item }: { item: any }) => {
        const product = item.productId;
        if (!product) return null;

        const salePrice = item.salePrice || 0;
        const originalPrice = product.base_price || 0;
        const discount = originalPrice > 0 ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

        // Sold % - Mocked based on stock/sold if not available, or just use a fixed mock if needed
        // Backend doesn't have sold_quantity in FlashSale.items yet, let's use a random-ish but deterministic seed
        const mockSoldPercent = Math.min(95, (product._id.toString().charCodeAt(0) % 50) + 20);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/product/${product._id}` as any)}
            >
                <Image source={{ uri: getProductMainImage(product) }} style={styles.image} />

                {/* Discount Badge */}
                {discount > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                    </View>
                )}

                <Text style={styles.price}>{salePrice.toLocaleString('vi-VN')}₫</Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${mockSoldPercent}%` }]} />
                    <Text style={styles.progressText}>
                        {mockSoldPercent > 90 ? 'Sắp hết' : `Đã bán ${mockSoldPercent}%`}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FLASH</Text>
                    <Text style={styles.titleFlash}>SALE</Text>
                    <Text style={{ fontSize: 18, marginLeft: 4 }}>🔥</Text>

                    {/* Countdown */}
                    <View style={styles.countdownContainer}>
                        <Text style={styles.timeBox}>{formatNumber(timeLeft.hours)}</Text>
                        <Text style={styles.timeColon}>:</Text>
                        <Text style={styles.timeBox}>{formatNumber(timeLeft.minutes)}</Text>
                        <Text style={styles.timeColon}>:</Text>
                        <Text style={styles.timeBox}>{formatNumber(timeLeft.seconds)}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={items}
                keyExtractor={item => item._id || item.productId?._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginTop: 8,
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        marginRight: 4,
    },
    titleFlash: {
        fontSize: 16,
        fontWeight: '800',
        color: '#e53935', // Premium red instead of orange
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    timeBox: {
        backgroundColor: '#111',
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 4,
        overflow: 'hidden',
    },
    timeColon: {
        color: '#111',
        fontWeight: 'bold',
        marginHorizontal: 3,
    },
    seeAll: {
        fontSize: 13,
        color: '#666',
    },
    listContent: {
        paddingHorizontal: 10,
    },
    card: {
        width: 120,
        marginHorizontal: 5,
        alignItems: 'center',
        position: 'relative',
    },
    image: {
        width: 120,
        height: 120,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
    },
    discountBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#111',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    discountText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    price: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ee4d2d', // Shopee Orange-Red
        marginTop: 10,
        marginBottom: 8,
    },
    progressContainer: {
        width: 100,
        height: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ee4d2d',
        borderRadius: 8,
    },
    progressText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: 'bold',
        zIndex: 1,
    }
});
