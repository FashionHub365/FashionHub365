import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import listingApi from '../../apis/listingApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';

const getCategoryIcon = (title: string): any => {
    const name = title.toLowerCase();

    if (name.includes('shirt') || name.includes('t-shirt') || name.includes('thun')) return 'tshirt-crew-outline';
    if (name.includes('blouse') || name.includes('sơ mi') || name.includes('áo')) return 'tshirt-v-outline';
    if (name.includes('sneaker') || name.includes('thể thao')) return 'shoe-sneaker';
    if (name.includes('boot') || name.includes('giày') || name.includes('shoe')) return 'shoe-formal';
    if (name.includes('sandal') || name.includes('dép')) return 'shoe-cleat';
    if (name.includes('pant') || name.includes('jean') || name.includes('quần')) return 'hanger';
    if (name.includes('skirt') || name.includes('dress') || name.includes('đầm') || name.includes('váy')) return 'hanger';
    if (name.includes('jacket') || name.includes('coat') || name.includes('khoác')) return 'hanger';
    if (name.includes('bag') || name.includes('túi') || name.includes('balo')) return 'bag-personal-outline';
    if (name.includes('hat') || name.includes('mũ') || name.includes('nón')) return 'hat-fedora';
    if (name.includes('accessory') || name.includes('phụ kiện') || name.includes('kính')) return 'glasses';
    if (name.includes('watch') || name.includes('đồng hồ')) return 'watch';

    return 'hanger';
};

const CATEGORY_COLORS = [
    '#E3F2FD', '#F3E5F5', '#FFF3E0', '#E8F5E9', '#FCE4EC',
    '#E0F2F1', '#FFFDE7', '#F3E5F5', '#E1F5FE', '#F1F8E9'
];

const ICON_COLORS = [
    '#1976D2', '#7B1FA2', '#F57C00', '#388E3C', '#C2185B',
    '#00796B', '#FBC02D', '#8E24AA', '#0288D1', '#558B2F'
];

export default function CategoriesGrid() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await listingApi.getCategories();
                if (res && (res as any).success) {
                    const data = (res as any).data || [];
                    setCategories(data.slice(0, 10));
                }
            } catch (error) {
                console.error('Fetch categories error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                {Array.from({ length: 10 }).map((_, idx) => (
                    <View key={idx} style={styles.itemCard}>
                        <Skeleton style={styles.iconContainer} />
                        <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Static Voucher Shortcut */}
            <TouchableOpacity
                style={styles.itemCard}
                activeOpacity={0.7}
                onPress={() => router.push('/marketing/vouchers' as any)}
            >
                <View style={[styles.iconContainer, { backgroundColor: '#FFF2EE', borderColor: '#EE4D2D' }]}>
                    <MaterialCommunityIcons
                        name="ticket-percent-outline"
                        size={28}
                        color="#EE4D2D"
                    />
                </View>
                <Text style={[styles.title, { color: '#EE4D2D', fontWeight: 'bold' }]} numberOfLines={2}>
                    Mã Giảm Giá
                </Text>
            </TouchableOpacity>

            {categories.map((item, index) => {
                const title = item.name || item.title || 'Danh mục';
                const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                const iconColor = ICON_COLORS[index % ICON_COLORS.length];

                return (
                    <TouchableOpacity
                        key={item._id || item.id || item.uuid}
                        style={styles.itemCard}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/category/${item._id || item.id}` as any)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: bgColor, borderColor: bgColor }]}>
                            <MaterialCommunityIcons
                                name={getCategoryIcon(title)}
                                size={28}
                                color={iconColor}
                            />
                        </View>
                        <Text style={styles.title} numberOfLines={2}>
                            {title}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 5,
    },
    itemCard: {
        width: '20%',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18, // Modern rounded square (Squircle-ish)
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    icon: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    title: {
        fontSize: 11,
        color: '#444',
        textAlign: 'center',
        lineHeight: 14,
    }
});
