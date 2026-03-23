import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderSuccessScreen() {
    const { orderId } = useLocalSearchParams();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            <View style={styles.content}>
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark" size={48} color="#fff" />
                </Animated.View>
                <Text style={styles.title}>Đặt hàng thành công!</Text>

                {orderId && (
                    <View style={styles.orderIdBox}>
                        <Text style={styles.orderIdLabel}>Mã đơn hàng</Text>
                        <Text style={styles.orderIdValue}>#{String(orderId).slice(-8)}</Text>
                    </View>
                )}

                <Text style={styles.subtitle}>
                    Cảm ơn bạn đã mua sắm tại FashionHub365.{'\n'}
                    Đơn hàng của bạn đang được xử lý.
                </Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace('/orders')}
                >
                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Xem đơn hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={styles.secondaryBtnText}>Tiếp tục mua sắm</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 30,
    },
    checkCircle: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#111',
        justifyContent: 'center', alignItems: 'center', marginBottom: 28,
    },
    title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 12, textAlign: 'center' },
    orderIdBox: {
        backgroundColor: '#f9f9f9', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 8, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eee'
    },
    orderIdLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    orderIdValue: { fontSize: 16, fontWeight: '700', color: '#111', letterSpacing: 1 },
    subtitle: { fontSize: 15, color: '#666', lineHeight: 24, textAlign: 'center', marginBottom: 40 },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#111', width: '100%', paddingVertical: 16,
        borderRadius: 14, justifyContent: 'center', marginBottom: 14,
    },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    secondaryBtn: {
        width: '100%', paddingVertical: 16, borderRadius: 14,
        borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff'
    },
    secondaryBtnText: { color: '#333', fontWeight: '600', fontSize: 15 },
});
