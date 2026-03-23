import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfileScreen() {
    const { user, updateProfile } = useAuth();

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ và tên.');
            return;
        }

        setLoading(true);
        try {
            // Backend update profile might require basic fields
            const res = await updateProfile({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim()
            });

            if (res && res.success) {
                Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
                router.back();
            } else {
                Alert.alert('Lỗi', res?.message || 'Không thể cập nhật thông tin.');
            }
        } catch (err) {
            console.log('Update profile error', err);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sửa Hồ Sơ</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.avatarSection}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={40} color="#ccc" />
                        </View>
                        <TouchableOpacity style={styles.changeAvatarBtn}>
                            <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Họ</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Nhập họ của bạn"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tên</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email || ''}
                            editable={false}
                        />
                        <Text style={styles.helpText}>Email không thể thay đổi.</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    scrollContent: { padding: 20 },

    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#f0f0f0',
        justifyContent: 'center', alignItems: 'center', marginBottom: 10
    },
    changeAvatarBtn: { padding: 6 },
    changeAvatarText: { color: '#000', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        paddingHorizontal: 15, paddingVertical: 12,
        fontSize: 15, color: '#111', backgroundColor: '#fff'
    },
    disabledInput: { backgroundColor: '#f5f5f5', color: '#888' },
    helpText: { fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' },

    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
    saveBtn: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
    disabledBtn: { opacity: 0.7 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
