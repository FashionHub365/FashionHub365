import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import addressApi from '@/apis/addressApi';
import checkoutApi from '@/apis/checkoutApi';
import marketingApi from '@/apis/marketingApi';
import VoucherCard from '@/components/ui/VoucherCard';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: 'cash-outline' },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: 'card-outline' },
];

export default function CheckoutScreen() {
  const { user, isAuthenticated } = useAuth();
  const { cartData, fetchCart } = useCart();
  const { items = [], totalAmount = 0 } = cartData || {};

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isVoucherModalVisible, setVoucherModalVisible] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    line1: '',
    city: '',
    district: '',
    ward: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login' as any);
      return;
    }
    loadAddresses();
    fetchMyVouchersForCheckout();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const res = (await addressApi.getAddresses()) as any;
      // Backend returns data: { addresses: [...] } or data: [...]
      const addressList = Array.isArray(res?.data?.addresses) ? res.data.addresses : (Array.isArray(res?.data) ? res.data : []);

      if (res?.success && addressList.length >= 0) {
        setAddresses(addressList);
        const defaultAddr = addressList.find((a: any) => a.is_default) || addressList[0];
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.log('Load addresses error:', err);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchMyVouchersForCheckout = async () => {
    setLoadingVouchers(true);
    try {
      const res = (await marketingApi.getMyVouchers()) as any;
      if (res && res.success && Array.isArray(res.data)) {
        setMyVouchers(res.data);
      } else {
        setMyVouchers([]);
      }
    } catch (err: any) {
      console.log('Error fetching checkout vouchers', err.message || err);
      setMyVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleSelectVoucher = (voucher: any) => {
    if (totalAmount < (voucher.min_order_amount || 0)) {
      Alert.alert('Không đủ điều kiện', `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString()}₫ để dùng mã này.`);
      return;
    }

    setSelectedVoucher(voucher);
    setVoucherCode(voucher.code);

    // Calculate discount
    let discount = 0;
    if (voucher.discount_type === 'percent') {
      discount = (totalAmount * voucher.discount_value) / 100;
      if (voucher.max_discount_amount) {
        discount = Math.min(discount, voucher.max_discount_amount);
      }
    } else {
      discount = voucher.discount_value;
    }

    setDiscountAmount(discount);
    setVoucherModalVisible(false);
  };

  const handleAddAddress = async () => {
    const { full_name, phone, line1, city, district } = newAddress;
    if (!full_name || !phone || !line1 || !city || !district) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin địa chỉ.');
      return;
    }
    try {
      const res = (await addressApi.createAddress(newAddress)) as any;
      if (res?.success) {
        await loadAddresses();
        setShowAddressForm(false);
        setNewAddress({ full_name: '', phone: '', line1: '', city: '', district: '', ward: '' });
        Alert.alert('✓', 'Thêm địa chỉ thành công!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể thêm địa chỉ.';
      Alert.alert('Lỗi', msg);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Không có sản phẩm nào để đặt hàng.');
      return;
    }

    Alert.alert(
      'Xác nhận đặt hàng',
      `Tổng: ${grandTotal.toLocaleString('vi-VN')}₫\nGiao đến: ${selectedAddress.address_line1}, ${selectedAddress.city}`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Đặt hàng',
          onPress: async () => {
            setLoading(true);
            try {
              const payload = {
                shipping_address: selectedAddress._id || selectedAddress.uuid,
                payment_method: paymentMethod,
                note: note.trim() || undefined,
                voucher_code: voucherCode.trim() || undefined,
              };
              const res = (await checkoutApi.placeOrder(payload)) as any;
              if (res?.success) {
                await fetchCart();
                router.replace({
                  pathname: '/(checkout)/order-success' as any,
                  params: { orderId: res.data?.orders?.[0]?._id || 'new' },
                });
              }
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
              Alert.alert('Lỗi', msg);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const shippingFee = 30000;
  const grandTotal = Math.max(0, totalAmount + shippingFee - discountAmount);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── ADDRESS SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#111" />
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>

          {loadingAddresses ? (
            <ActivityIndicator color="#111" style={{ padding: 20 }} />
          ) : addresses.length === 0 && !showAddressForm ? (
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowAddressForm(true)}>
              <Ionicons name="add-circle-outline" size={22} color="#111" />
              <Text style={styles.addAddressText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          ) : (
            <>
              {(addresses || []).map((addr: any) => (
                <TouchableOpacity
                  key={addr._id || addr.uuid}
                  style={[styles.addressCard, selectedAddress?._id === addr._id && styles.addressCardSelected]}
                  onPress={() => setSelectedAddress(addr)}
                >
                  <View style={styles.radioOuter}>
                    {selectedAddress?._id === addr._id && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.addrTopRow}>
                      <Text style={styles.addrName}>{addr.full_name || 'Người nhận'}</Text>
                      <Text style={styles.addrPhone}>{addr.phone}</Text>
                    </View>
                    <Text style={styles.addrDetail} numberOfLines={2}>
                      {[addr.line1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                    </Text>
                    {addr.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {!showAddressForm && (
                <TouchableOpacity style={styles.addAddressSmallBtn} onPress={() => setShowAddressForm(true)}>
                  <Ionicons name="add" size={18} color="#111" />
                  <Text style={styles.addAddressSmallText}>Thêm địa chỉ</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Add Address Form */}
          {showAddressForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Địa chỉ mới</Text>
              <TextInput style={styles.input} placeholder="Họ và tên người nhận *" value={newAddress.full_name} onChangeText={(t) => setNewAddress({ ...newAddress, full_name: t })} placeholderTextColor="#aaa" />
              <TextInput style={styles.input} placeholder="Số điện thoại *" value={newAddress.phone} onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })} keyboardType="phone-pad" placeholderTextColor="#aaa" />
              <TextInput style={styles.input} placeholder="Địa chỉ chi tiết *" value={newAddress.line1} onChangeText={(t) => setNewAddress({ ...newAddress, line1: t })} placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Phường/Xã" value={newAddress.ward} onChangeText={(t) => setNewAddress({ ...newAddress, ward: t })} placeholderTextColor="#aaa" />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Quận/Huyện *" value={newAddress.district} onChangeText={(t) => setNewAddress({ ...newAddress, district: t })} placeholderTextColor="#aaa" />
              </View>
              <TextInput style={styles.input} placeholder="Tỉnh/Thành phố *" value={newAddress.city} onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowAddressForm(false)}>
                  <Text style={styles.formCancelText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formSaveBtn} onPress={handleAddAddress}>
                  <Text style={styles.formSaveText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── ORDER ITEMS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={20} color="#111" />
            <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
          </View>
          {items.map((item: any, idx: number) => (
            <View key={item.itemId || idx} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={2}>{item.productName || item.name || 'Sản phẩm'}</Text>
                <Text style={styles.orderItemVariant}>
                  {[item.color, item.size].filter(Boolean).join(' / ')} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
              </Text>
            </View>
          ))}
        </View>

        {/* ── PAYMENT METHOD ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color="#111" />
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          </View>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.paymentOption, paymentMethod === pm.id && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod(pm.id)}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === pm.id && <View style={styles.radioInner} />}
              </View>
              <Ionicons name={pm.icon as any} size={22} color="#333" style={{ marginRight: 12 }} />
              <Text style={styles.paymentLabel}>{pm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── VOUCHER ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#111" />
            <Text style={styles.sectionTitle}>FashionHub Voucher</Text>
          </View>
          <TouchableOpacity
            style={styles.voucherSelector}
            onPress={() => setVoucherModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="ticket-outline" size={18} color="#EE4D2D" style={{ marginRight: 8 }} />
              <Text style={[styles.voucherSelectorText, selectedVoucher && { color: '#EE4D2D', fontWeight: 'bold' }]}>
                {selectedVoucher ? `Đã chọn mã: ${selectedVoucher.code}` : 'Chọn hoặc nhập mã'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {discountAmount > 0 && (
                <Text style={styles.discountPreview}>-{discountAmount.toLocaleString('vi-VN')}₫</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── NOTE ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={20} color="#111" />
            <Text style={styles.sectionTitle}>Ghi chú</Text>
          </View>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            placeholder="Lưu ý cho người bán..."
            placeholderTextColor="#aaa"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View style={[styles.section, { backgroundColor: '#fafafa', borderRadius: 12, padding: 16, marginBottom: 100 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Tổng kết đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính ({items.length} sản phẩm)</Text>
            <Text style={styles.summaryValue}>{totalAmount.toLocaleString('vi-VN')}₫</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{shippingFee.toLocaleString('vi-VN')}₫</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá Voucher</Text>
              <Text style={[styles.summaryValue, { color: '#EE4D2D' }]}>-{discountAmount.toLocaleString('vi-VN')}₫</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{grandTotal.toLocaleString('vi-VN')}₫</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── VOUCHER SELECTION MODAL ── */}
      <Modal
        visible={isVoucherModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVoucherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn FashionHub Voucher</Text>
              <TouchableOpacity onPress={() => setVoucherModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <ActivityIndicator color="#EE4D2D" size="large" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={myVouchers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <VoucherCard
                    voucher={item}
                    isClaimed={true}
                    onUse={() => handleSelectVoucher(item)}
                    actionLabel="Dùng ngay"
                  />
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <Ionicons name="ticket-outline" size={60} color="#eee" />
                    <Text style={styles.noVouchersText}>Bạn chưa có mã giảm giá nào</Text>
                    <TouchableOpacity
                      style={styles.formSaveBtn}
                      onPress={() => {
                        setVoucherModalVisible(false);
                        router.push('/marketing/vouchers');
                      }}
                    >
                      <Text style={styles.formSaveText}>Săn mã ngay</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Tổng thanh toán</Text>
          <Text style={styles.bottomPrice}>{grandTotal.toLocaleString('vi-VN')}₫</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>ĐẶT HÀNG</Text>
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
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

  section: { padding: 16, borderBottomWidth: 8, borderBottomColor: '#f5f5f5' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },

  // Address
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 14,
    borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 10,
  },
  addressCardSelected: { borderColor: '#111', backgroundColor: '#fafafa' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#111' },
  addrTopRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  addrName: { fontSize: 14, fontWeight: '700', color: '#111' },
  addrPhone: { fontSize: 13, color: '#666' },
  addrDetail: { fontSize: 13, color: '#666', lineHeight: 19 },
  defaultBadge: { marginTop: 6, backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#666' },

  addAddressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, borderStyle: 'dashed', gap: 8,
  },
  addAddressText: { fontSize: 14, fontWeight: '600', color: '#111' },
  addAddressSmallBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  addAddressSmallText: { fontSize: 13, fontWeight: '600', color: '#111' },

  // Form
  formCard: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 16, marginTop: 10 },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#333', backgroundColor: '#fff', marginBottom: 10,
  },
  formCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  formCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  formSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#111', alignItems: 'center' },
  formSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Order Items
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  orderItemInfo: { flex: 1, marginRight: 10 },
  orderItemName: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 4 },
  orderItemVariant: { fontSize: 12, color: '#888' },
  orderItemPrice: { fontSize: 14, fontWeight: '700', color: '#111' },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 10,
  },
  paymentOptionSelected: { borderColor: '#111', backgroundColor: '#fafafa' },
  paymentLabel: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },

  // Voucher
  voucherRow: { flexDirection: 'row', gap: 10 },
  voucherInput: {
    flex: 1, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa',
  },
  voucherApplyBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#111', borderRadius: 8, justifyContent: 'center' },
  voucherApplyText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#e5e5e5', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#111' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  bottomLabel: { fontSize: 12, color: '#888' },
  bottomPrice: { fontSize: 20, fontWeight: '800', color: '#111' },
  placeOrderBtn: {
    backgroundColor: '#111', paddingVertical: 14, paddingHorizontal: 36,
    borderRadius: 14, alignItems: 'center',
  },
  placeOrderBtnDisabled: { backgroundColor: '#aaa' },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },

  // New Voucher Styles
  voucherSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderWidth: 1, borderColor: '#FFD8CC', borderRadius: 8,
    backgroundColor: '#FFF2EE',
  },
  voucherSelectorText: { fontSize: 14, color: '#666' },
  discountPreview: { fontSize: 14, fontWeight: 'bold', color: '#EE4D2D', marginRight: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', paddingBottom: 20 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  closeBtn: { padding: 4 },
  noVouchersText: { fontSize: 14, color: '#999', marginVertical: 20 },
});
