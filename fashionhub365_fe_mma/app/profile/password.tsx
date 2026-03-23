import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ChangePasswordScreen() {
    const { changePassword } = useAuth();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword({
                oldPassword,
                newPassword
            });

            if (res && res.success) {
                Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
                router.back();
            } else {
                Alert.alert('Lỗi', res?.message || 'Không thể đổi mật khẩu.');
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        label: string,
        value: string,
        onChange: any,
        placeholder: string,
        showPass: boolean,
        setShowPass: any
    ) => (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    secureTextEntry={!showPass}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi Mật Khẩu</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <Text style={styles.description}>
                        Mật khẩu mới của bạn phải có độ dài ít nhất 6 ký tự.
                    </Text>

                    {renderInput('Mật khẩu hiện tại', oldPassword, setOldPassword, 'Nhập mật khẩu hiện tại', showOld, setShowOld)}
                    {renderInput('Mật khẩu mới', newPassword, setNewPassword, 'Nhập mật khẩu mới', showNew, setShowNew)}
                    {renderInput('Xác nhận mật khẩu mới', confirmPassword, setConfirmPassword, 'Nhập lại mật khẩu mới', showConfirm, setShowConfirm)}

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
                        <Text style={styles.saveBtnText}>Lưu Mật Khẩu</Text>
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
    description: { fontSize: 14, color: '#666', marginBottom: 30, lineHeight: 22 },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        backgroundColor: '#fff'
    },
    input: {
        flex: 1, paddingHorizontal: 15, paddingVertical: 12,
        fontSize: 15, color: '#111',
    },
    eyeIcon: { padding: 12 },

    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
    saveBtn: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
    disabledBtn: { opacity: 0.7 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
