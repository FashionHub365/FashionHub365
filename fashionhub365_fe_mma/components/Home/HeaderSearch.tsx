import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../../contexts/CartContext';

export default function HeaderSearch() {
    const { cartData } = useCart();
    const cartItemCount = cartData?.totalItems || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Search Bar - Tap to go to Explore */}
                <TouchableOpacity
                    style={styles.searchContainer}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/explore')}
                >
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Tìm kiếm thời trang, thương hiệu...</Text>
                    <TouchableOpacity style={styles.cameraIcon}>
                        <Ionicons name="scan-outline" size={20} color="#888" />
                    </TouchableOpacity>
                </TouchableOpacity>

                {/* Cart Icon */}
                <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/cart')}>
                    <Ionicons name="bag-handle-outline" size={26} color="#111" />
                    {cartItemCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Wishlist or Notification Icon */}
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={24} color="#111" />
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>3</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20, // Fully rounded for modern look
        height: 40,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 14,
        color: '#888',
    },
    cameraIcon: {
        padding: 4,
    },
    iconButton: {
        position: 'relative',
        marginLeft: 10,
        padding: 2,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        backgroundColor: '#e53935',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
});
