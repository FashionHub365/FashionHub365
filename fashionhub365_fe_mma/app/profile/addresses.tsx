import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import addressApi from '../../apis/addressApi';
import { useAuth } from '../../contexts/AuthContext';

export default function AddressesScreen() {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        line1: '',
        ward: '',
        district: '',
        city: '',
        is_default: false,
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const res = (await addressApi.getAddresses()) as any;
            const addressList = Array.isArray(res?.data?.addresses) ? res.data.addresses : (Array.isArray(res?.data) ? res.data : []);
            if (res?.success) {
                setAddresses(addressList);
            }
        } catch (err) {
            console.log('Error fetching addresses:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormMode('create');
        setSelectedId(null);
        setFormData({
            full_name: user?.last_name && user?.first_name ? `${user.last_name} ${user.first_name}` : '',
            phone: user?.phone || '',
            line1: '', ward: '', district: '', city: '',
            is_default: addresses.length === 0,
        });
        setShowModal(true);
    };

    const handleOpenEdit = (addr: any) => {
        setFormMode('edit');
        setSelectedId(addr.uuid || addr._id);
        setFormData({
            full_name: addr.full_name,
            phone: addr.phone,
            line1: addr.line1 || '',
            ward: addr.ward || '',
            district: addr.district || '',
            city: addr.city || '',
            is_default: addr.is_default,
        });
        setShowModal(true);
    };

    const handleDelete = (uuid: string) => {
        Alert.alert('Xoá địa chỉ', 'Bạn có chắc chắn muốn xoá địa chỉ này?', [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xoá',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await addressApi.deleteAddress(uuid);
                        fetchAddresses();
                    } catch (err) {
                        Alert.alert('Lỗi', 'Không thể xoá địa chỉ.');
                    }
                }
            }
        ]);
    };

    const handleSetDefault = async (uuid: string) => {
        try {
            await addressApi.setDefaultAddress(uuid);
            fetchAddresses();
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể đặt mặc định.');
        }
    };

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.phone || !formData.line1 || !formData.city) {
            Alert.alert('Lỗi', 'Vui lòng điền đủ Tên, SĐT, Đường và Tỉnh/Thành phố.');
            return;
        }

        setSubmitLoading(true);
        try {
            if (formMode === 'create') {
                await addressApi.createAddress(formData);
            } else if (selectedId) {
                await addressApi.updateAddress(selectedId, formData);
            }
            setShowModal(false);
            fetchAddresses();
        } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể lưu địa chỉ.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const id = item.uuid || item._id;
        return (
            <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.addressName}>{item.full_name}</Text>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.addressPhone}>{item.phone}</Text>
                <Text style={styles.addressText}>{item.line1}</Text>
                <Text style={styles.addressText}>
                    {[item.ward, item.district, item.city].filter(Boolean).join(', ')}
                </Text>

                <View style={styles.actionsRow}>
                    {!item.isDefault && (
                        <TouchableOpacity onPress={() => handleSetDefault(id)}>
                            <Text style={styles.actionTextDef}>Đặt làm mặc định</Text>
                        </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
                        <Ionicons name="create-outline" size={20} color="#111" />
                    </TouchableOpacity>
                    {!item.isDefault && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(id)}>
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sổ Địa Chỉ</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.uuid || item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="location-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
                        </View>
                    }
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
                    <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addBtnText}>Thêm Địa Chỉ Mới</Text>
                </TouchableOpacity>
            </View>

            {/* Address Form Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {formMode === 'create' ? 'Thêm Địa Chỉ' : 'Sửa Địa Chỉ'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#111" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>

                            <Text style={styles.label}>Họ và tên</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.full_name}
                                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                placeholder="Nhập họ và tên"
                            />

                            <Text style={styles.label}>Số điện thoại</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Tỉnh/Thành phố</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                                placeholder="Ví dụ: Hà Nội"
                            />

                            <Text style={styles.label}>Quận/Huyện</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.district}
                                onChangeText={(text) => setFormData({ ...formData, district: text })}
                                placeholder="Ví dụ: Cầu Giấy"
                            />

                            <Text style={styles.label}>Phường/Xã</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.ward}
                                onChangeText={(text) => setFormData({ ...formData, ward: text })}
                                placeholder="Ví dụ: Dịch Vọng"
                            />

                            <Text style={styles.label}>Tên đường, Toà nhà, Số nhà</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.line1}
                                onChangeText={(text) => setFormData({ ...formData, line1: text })}
                                placeholder="Chi tiết địa chỉ"
                            />

                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                                disabled={formMode === 'edit' && addresses.find(a => a.uuid === selectedId)?.is_default}
                            >
                                <Ionicons
                                    name={formData.is_default ? 'checkbox' : 'square-outline'}
                                    size={24} color={formData.is_default ? '#111' : '#ccc'}
                                />
                                <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, submitLoading && styles.disabledBtn]}
                                onPress={handleSubmit}
                                disabled={submitLoading}
                            >
                                {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu Địa Chỉ</Text>}
                            </TouchableOpacity>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    listContainer: { padding: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#888', marginTop: 10, fontSize: 16 },

    addressCard: {
        backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#eee'
    },
    defaultCard: { borderColor: '#111' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    addressName: { fontSize: 16, fontWeight: '600', color: '#111' },
    defaultBadge: {
        backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
    },
    defaultBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    addressPhone: { fontSize: 14, color: '#666', marginBottom: 6 },
    addressText: { fontSize: 14, color: '#444', lineHeight: 20 },

    actionsRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0'
    },
    actionTextDef: { fontSize: 14, color: '#3498db', fontWeight: '500' },
    actionBtn: { padding: 8, marginLeft: 15 },

    footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    addBtn: {
        flexDirection: 'row', backgroundColor: '#000', borderRadius: 8, paddingVertical: 14,
        justifyContent: 'center', alignItems: 'center'
    },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        height: '90%', padding: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    closeBtn: { padding: 5 },
    formScroll: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, backgroundColor: '#f9f9f9', color: '#111'
    },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    checkboxLabel: { marginLeft: 10, fontSize: 15, color: '#333' },
    saveBtn: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
    disabledBtn: { opacity: 0.7 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
