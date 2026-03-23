import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { getProductMainImage } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

interface ProductCardProps {
    item: any;
    width?: number;
}

export default function ProductCard({ item, width: customWidth }: ProductCardProps) {
    const cardWidth = customWidth || CARD_WIDTH;
    const imageUrl = getProductMainImage(item);
    const price = item.base_price || 0;
    const discount = item.discount_percentage || 0;
    const salePrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

    return (
        <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => router.push(`/product/${item._id || item.uuid}` as any)}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                {discount > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{salePrice.toLocaleString('vi-VN')}₫</Text>
                </View>
                {item.sold_count > 0 && (
                    <Text style={styles.soldText}>Đã bán {item.sold_count}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 10,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f5f5f5',
    },
    discountBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#ee4d2d',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardInfo: {
        padding: 8,
    },
    name: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
        height: 36,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ee4d2d',
    },
    soldText: {
        fontSize: 11,
        color: '#888',
        marginTop: 4,
    },
});
