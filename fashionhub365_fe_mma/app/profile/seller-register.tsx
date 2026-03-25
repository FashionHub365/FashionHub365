import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    ScrollView, TextInput, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import storeApi from '../../apis/storeApi';

export default function SellerRegisterScreen() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !email || !phone || !description || !address || !bankName || !accountName || !accountNumber) {
            Alert.alert("Thông báo", "Vui lòng điền đầy đủ tất cả các trường thông tin bao gồm cả thông tin ngân hàng.");
            return;
        }

        if (description.length < 10) {
            Alert.alert("Thông báo", "Mô tả phải có ít nhất 10 ký tự.");
            return;
        }

        if (phone.length < 8) {
            Alert.alert("Thông báo", "Số điện thoại không hợp lệ (ít nhất 8 số).");
            return;
        }

        try {
            setLoading(true);
            const res = await storeApi.createStore({
                name,
                description,
                email,
                phone,
                information: {
                    addressesText: address
                },
                addresses: [{
                    detail_address: address,
                    is_default: true,
                    type: 'warehouse'
                }],
                bank_accounts: [{
                    bank_name: bankName,
                    account_name: accountName,
                    account_number: accountNumber
                }],
                is_draft: true, // Backend requires this for pending status
                status: 'inactive' // Set to inactive initially, approved will set to active
            });

            if ((res as any).success) {
                Alert.alert(
                    "Thành công",
                    "Yêu cầu mở shop của bạn đã được gửi. Vui lòng chờ Admin xét duyệt.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            console.error('Register seller error:', error);
            const msg = error.response?.data?.message || "Không thể gửi yêu cầu đăng ký.";
            Alert.alert("Lỗi", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đăng ký bán hàng</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <LinearGradient
                        colors={['#e3f2fd', '#fff']}
                        style={styles.introCard}
                    >
                        <Ionicons name="rocket-outline" size={48} color="#1a73e8" />
                        <Text style={styles.introTitle}>Bắt đầu kinh doanh ngay!</Text>
                        <Text style={styles.introSub}>
                            Điền thông tin bên dưới để gửi yêu cầu mở gian hàng trên FashionHub365.
                        </Text>
                    </LinearGradient>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên cửa hàng *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Fashion House"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email liên hệ *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Địa chỉ kho hàng</Text>
                            <TextInput
                                style={[styles.input, { height: 80, paddingTop: 12 }]}
                                placeholder="Địa chỉ chi tiết để lấy hàng"
                                multiline
                                textAlignVertical="top"
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mô tả gian hàng * (Ít nhất 10 ký tự)</Text>
                            <TextInput
                                style={[styles.input, { height: 80, paddingTop: 12 }]}
                                placeholder="Giới thiệu ngắn gọn về shop của bạn..."
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Thông tin ngân hàng</Text>
                            <Text style={styles.sectionSub}>Để nhận thanh toán từ FashionHub365</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên ngân hàng *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Vietcombank, MB Bank..."
                                value={bankName}
                                onChangeText={setBankName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên chủ tài khoản *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="NGUYEN VAN A"
                                autoCapitalize="characters"
                                value={accountName}
                                onChangeText={setAccountName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số tài khoản *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số tài khoản"
                                keyboardType="numeric"
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                            />
                        </View>

                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle-outline" size={18} color="#666" />
                            <Text style={styles.noteText}>
                                Bằng cách nhấn Đăng ký, bạn đồng ý với các Điều khoản & Chính sách của người bán trên FashionHub365.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>GỬI YÊU CẦU ĐĂNG KÝ</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    backBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    introCard: {
        padding: 24,
        alignItems: 'center',
        marginBottom: 8,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a73e8',
        marginTop: 16,
        marginBottom: 8,
    },
    introSub: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionHeader: {
        marginTop: 10,
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f4',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    sectionSub: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ebed',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 15,
        color: '#111',
    },
    noteBox: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    submitBtn: {
        backgroundColor: '#111',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    disabledBtn: {
        backgroundColor: '#ccc',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
