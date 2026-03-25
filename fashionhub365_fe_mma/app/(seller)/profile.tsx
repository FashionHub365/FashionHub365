import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SellerProfileScreen() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tài Khoản Người Bán</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>{user?.profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}</Text>
                    </View>
                    <Text style={styles.userName}>{user?.profile?.full_name || user?.username || 'Seller User'}</Text>
                    <Text style={styles.userRole}>Người Bán Hàng</Text>
                </View>

                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
                        <Text style={styles.logoutText}>Đăng Xuất</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
    content: { flex: 1, padding: 20 },
    avatarContainer: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
    avatarFallback: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
    userName: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 5 },
    userRole: { fontSize: 14, color: '#666' },
    menuContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 10 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        gap: 15,
        borderBottomWidth: 0,
    },
    logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
});
