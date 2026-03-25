import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import voucherApi from '../../apis/voucherApi';

export default function VoucherForm() {
    const { id } = useLocalSearchParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        discount_type: 'percentage', // percentage or fixed
        discount_value: '',
        min_order_value: '0',
        max_discount: '',
        usage_limit: '100',
        start_at: '',
        ends_at: '',
        is_public: true
    });

    useEffect(() => {
        if (isEdit) {
            loadVoucherData();
        } else {
            // Set default dates for new voucher
            const now = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(now.getMonth() + 1);

            setFormData(prev => ({
                ...prev,
                start_at: now.toISOString().split('T')[0],
                ends_at: nextMonth.toISOString().split('T')[0]
            }));
        }
    }, [id]);

    const loadVoucherData = async () => {
        try {
            const res = await voucherApi.getVoucherById(id as string);
            if (res && (res as any).success) {
                const voucher = (res as any).data;
                if (voucher) {
                    setFormData({
                        name: voucher.name || '',
                        code: voucher.code || '',
                        description: voucher.description || '',
                        discount_type: voucher.discount_type || 'percentage',
                        discount_value: String(voucher.discount_value || ''),
                        min_order_value: String(voucher.min_order_amount || voucher.min_order_value || '0'),
                        max_discount: String(voucher.max_discount || ''),
                        usage_limit: String(voucher.usage_limit || '100'),
                        start_at: voucher.start_date ? new Date(voucher.start_date).toISOString().split('T')[0] : (voucher.start_at ? new Date(voucher.start_at).toISOString().split('T')[0] : ''),
                        ends_at: voucher.end_date ? new Date(voucher.end_date).toISOString().split('T')[0] : (voucher.ends_at ? new Date(voucher.ends_at).toISOString().split('T')[0] : ''),
                        is_public: voucher.is_public !== undefined ? voucher.is_public : true
                    });
                }
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể tải thông tin voucher');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        const { name, code, discount_value, start_at, ends_at } = formData;
        if (!name || !code || !discount_value || !start_at || !ends_at) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                discount_type: formData.discount_type === 'percentage' ? 'percent' : 'fixed',
                discount_value: Number(formData.discount_value),
                min_order_amount: Number(formData.min_order_value),
                max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
                usage_limit: Number(formData.usage_limit),
                start_date: new Date(formData.start_at).toISOString(),
                end_date: new Date(formData.ends_at).toISOString(),
                is_public: formData.is_public
            };

            if (isEdit) {
                await voucherApi.updateVoucher(id as string, payload);
                Alert.alert('Thành công', 'Đã cập nhật voucher!');
            } else {
                await voucherApi.createVoucher(payload);
                Alert.alert('Thành công', 'Đã tạo voucher mới!');
            }
            router.back();
        } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#333" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={24} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEdit ? 'Sửa' : 'Tạo'} Voucher</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#ee4d2d" />
                        ) : (
                            <Text style={styles.saveBtnText}>Lưu</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tên chương trình *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ví dụ: Ưu đãi tháng 3"
                            value={formData.name}
                            onChangeText={(txt) => setFormData({ ...formData, name: txt })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mã Voucher * (Ví dụ: THANG3OFF)</Text>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            placeholder="Tối đa 20 ký tự"
                            autoCapitalize="characters"
                            value={formData.code}
                            onChangeText={(txt) => setFormData({ ...formData, code: txt.toUpperCase() })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Loại giảm giá</Text>
                            <View style={styles.typeRow}>
                                <TouchableOpacity
                                    style={[styles.typeBtn, formData.discount_type === 'percentage' && styles.typeBtnActive]}
                                    onPress={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                >
                                    <Text style={[styles.typeBtnText, formData.discount_type === 'percentage' && styles.typeBtnTextActive]}>%</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeBtn, formData.discount_type === 'fixed' && styles.typeBtnActive]}
                                    onPress={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                >
                                    <Text style={[styles.typeBtnText, formData.discount_type === 'fixed' && styles.typeBtnTextActive]}>₫</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.formGroup, { flex: 2 }]}>
                            <Text style={styles.label}>Mức giảm *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={formData.discount_type === 'percentage' ? "Ví dụ: 10 (%)" : "Ví dụ: 20000 (₫)"}
                                keyboardType="numeric"
                                value={formData.discount_value}
                                onChangeText={(txt) => setFormData({ ...formData, discount_value: txt })}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Đơn hàng tối thiểu (₫)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={formData.min_order_value}
                            onChangeText={(txt) => setFormData({ ...formData, min_order_value: txt })}
                        />
                    </View>

                    {formData.discount_type === 'percentage' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mức giảm tối đa (₫) (Tùy chọn)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Để trống nếu không giới hạn"
                                keyboardType="numeric"
                                value={formData.max_discount}
                                onChangeText={(txt) => setFormData({ ...formData, max_discount: txt })}
                            />
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tổng lượt sử dụng tối đa</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ví dụ: 100"
                            keyboardType="numeric"
                            value={formData.usage_limit}
                            onChangeText={(txt) => setFormData({ ...formData, usage_limit: txt })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Ngày bắt đầu *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                value={formData.start_at}
                                onChangeText={(txt) => setFormData({ ...formData, start_at: txt })}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Ngày kết thúc *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                value={formData.ends_at}
                                onChangeText={(txt) => setFormData({ ...formData, ends_at: txt })}
                            />
                        </View>
                    </View>

                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.label}>Công khai Voucher</Text>
                            <Text style={styles.hint}>Hiển thị voucher tại trang của Shop</Text>
                        </View>
                        <Switch
                            value={formData.is_public}
                            onValueChange={(val) => setFormData({ ...formData, is_public: val })}
                            trackColor={{ false: "#ddd", true: "#fbc2b5" }}
                            thumbColor={formData.is_public ? "#ee4d2d" : "#f4f3f4"}
                        />
                    </View>

                    <View style={{ height: 40 }} />
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ee4d2d',
    },
    scrollContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#f9f9f9',
    },
    codeInput: {
        letterSpacing: 2,
        fontWeight: 'bold',
        color: '#ee4d2d',
    },
    row: {
        flexDirection: 'row',
    },
    typeRow: {
        flexDirection: 'row',
        height: 44,
    },
    typeBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    typeBtnActive: {
        backgroundColor: '#ee4d2d',
        borderColor: '#ee4d2d',
    },
    typeBtnText: {
        fontSize: 16,
        color: '#666',
    },
    typeBtnTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    }
});
