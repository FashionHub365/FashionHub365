import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { fetchSellerOrders, updateOrderStatus } from '../../services/orderService';

const STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};
const STATUS_COLORS = {
  pending: '#f39c12',
  processing: '#3498db',
  shipped: '#9b59b6',
  delivered: '#2ecc71',
  cancelled: '#e74c3c'
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSellerOrders();
      setOrders(data || []);
      setFilteredOrders(data || []);
      setActiveFilter('all');
    } catch (err: any) {
      console.error('Error loading orders:', err);
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

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
      "Cập nhật trạng thái",
      `Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái ${STATUS_LABELS[newStatus].toUpperCase()}?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, newStatus, "");
              loadOrders();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể cập nhật trạng thái');
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
          <Text style={styles.orderId}>#{item.order_id || item._id?.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[item.status]?.toUpperCase() || item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.detailsBlock}>
          <Text style={styles.detailText}><Text style={styles.bold}>Khách hàng:</Text> {item.customer_name}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>Điện thoại:</Text> {item.customer_phone}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>Địa chỉ:</Text> {item.shipping_address_text}</Text>
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
          <Text style={styles.totalText}>Tổng: {item.total_amount?.toLocaleString('vi-VN')}₫</Text>
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3498db' }]} onPress={() => handleOrderUpdate(item._id, 'processing')}>
                  <Text style={styles.actionBtnText}>Xác nhận</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c' }]} onPress={() => handleOrderUpdate(item._id, 'cancelled')}>
                  <Text style={styles.actionBtnText}>Hủy đơn</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === 'processing' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#9b59b6' }]} onPress={() => handleOrderUpdate(item._id, 'shipped')}>
                <Text style={styles.actionBtnText}>Giao hàng</Text>
              </TouchableOpacity>
            )}
            {item.status === 'shipped' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2ecc71' }]} onPress={() => handleOrderUpdate(item._id, 'delivered')}>
                <Text style={styles.actionBtnText}>Hoàn tất</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadOrders}>
          <Text style={styles.refreshBtnText}>↻ Tải lại</Text>
        </TouchableOpacity>
      </View>

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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  filterWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterScroll: {
    paddingHorizontal: 15,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 14,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsBlock: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemsBlock: {
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
