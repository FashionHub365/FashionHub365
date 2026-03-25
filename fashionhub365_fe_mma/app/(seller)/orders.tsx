import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// @ts-ignore
import { fetchSellerOrders, updateOrderStatus } from '../../services/orderService';

const STATUS_FILTERS = ['all', 'created', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  created: 'Chờ duyệt',
  confirmed: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};
const STATUS_COLORS = {
  created: '#f39c12',
  confirmed: '#3498db',
  shipped: '#9b59b6',
  delivered: '#2ecc71',
  cancelled: '#e74c3c'
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchSellerOrders();
      setOrders(data || []);
      if (activeFilter === 'all') {
        setFilteredOrders(data || []);
      } else {
        setFilteredOrders((data || []).filter((o: any) => o.status === activeFilter));
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      Alert.alert('Lỗi', 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === filter));
    }
  };

  const handleOrderUpdate = (orderId: string, newStatus: string) => {
    Alert.alert(
      "Xác nhận cập nhật",
      `Bạn có muốn chuyển đơn hàng này sang trạng thái ${STATUS_LABELS[newStatus]}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, newStatus, "");
              loadOrders();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Lỗi cập nhật');
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }: { item: any }) => {
    // @ts-ignore
    const statusColor = STATUS_COLORS[item.status] || '#999';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>#{item.order_id || item._id?.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderTime}>{new Date(item.created_at || Date.now()).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        <View style={styles.detailsBlock}>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle-outline" size={18} color="#666" />
            <Text style={styles.detailText}><Text style={styles.bold}>{item.customer_name}</Text> • {item.customer_phone}</Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#888" />
            <Text style={styles.addressText} numberOfLines={2}>{item.shipping_address_text}</Text>
          </View>
        </View>

        <View style={styles.itemsBlock}>
          {item.items.map((prod: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{prod.quantity}x {prod.product_name}</Text>
              <Text style={styles.itemPrice}>{(prod.price * prod.quantity).toLocaleString('vi-VN')}₫</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{item.total_amount?.toLocaleString('vi-VN')}₫</Text>
          </View>
          <View style={styles.actions}>
            {item.status === 'created' && (
              <TouchableOpacity style={[styles.actionBtn, styles.primaryAction]} onPress={() => handleOrderUpdate(item._id, 'confirmed')}>
                <Text style={styles.actionBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity style={[styles.actionBtn, styles.accentAction]} onPress={() => handleOrderUpdate(item._id, 'shipped')}>
                <Text style={styles.actionBtnText}>Giao hàng</Text>
              </TouchableOpacity>
            )}
            {item.status === 'shipped' && (
              <TouchableOpacity style={[styles.actionBtn, styles.successAction]} onPress={() => handleOrderUpdate(item._id, 'delivered')}>
                <Text style={styles.actionBtnText}>Giao xong</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => Alert.alert('Thông tin', 'Tính năng chi tiết đang phát triển')}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#ee4d2d" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {STATUS_LABELS[filter]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ee4d2d" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={60} color="#ddd" />
          <Text style={styles.emptyText}>Chưa có đơn hàng nào.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ee4d2d"]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  headerIcon: {
    padding: 4,
  },
  filterWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: '#ee4d2d',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 10,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  orderTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailsBlock: {
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  },
  itemsBlock: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    color: '#444',
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ee4d2d',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  primaryAction: {
    backgroundColor: '#ee4d2d',
  },
  accentAction: {
    backgroundColor: '#3498db',
  },
  successAction: {
    backgroundColor: '#2ecc71',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  moreBtn: {
    padding: 4,
    marginLeft: 8,
  }
});
