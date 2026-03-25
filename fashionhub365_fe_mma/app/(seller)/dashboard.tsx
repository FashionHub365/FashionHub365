import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// @ts-ignore
import { getStoreStats } from '../../services/orderService';
import { IconSymbol } from '../../components/ui/icon-symbol';
// @ts-ignore
import storeApi from '../../apis/store.api';
import inventoryApi from '../../apis/inventoryApi';
import { useNotification } from '../../contexts/NotificationContext';

const { width } = Dimensions.get('window');

export default function SellerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [store, setStore] = useState<any>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { unreadCount } = useNotification();

  const fetchData = async () => {
    try {
      const [statsRes, storeRes, lowStockRes] = await Promise.all([
        getStoreStats(),
        storeApi.getMyStore(),
        inventoryApi.getLowStockAlerts(10)
      ]);

      const statsData = statsRes?.data || statsRes || {};
      const ordersByStatus = statsData.ordersByStatus || [];
      const pendingCount = ordersByStatus.find((s: any) => s._id === 'created')?.count || 0;

      setStats({
        ...statsData,
        summary: {
          ...statsData.summary,
          pendingOrders: pendingCount
        }
      });
      setStore(storeRes?.data?.store || storeRes?.data || storeRes);
      setLowStockCount(lowStockRes?.data?.length || 0);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ee4d2d" />
      </View>
    );
  }

  const { summary = {} } = stats || {};

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ee4d2d"]} />
        }
      >
        {/* Header with LinearGradient */}
        <LinearGradient
          colors={['#ee4d2d', '#ff7337']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.topHeader}>
              <View style={styles.backBtn} />
              <Text style={styles.headerTitle}>Kênh Người Bán</Text>
              <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/notifications')}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Store Profile Card */}
            <View style={styles.storeCard}>
              <View style={styles.storeMain}>
                <Image
                  source={{ uri: store?.logo || 'https://via.placeholder.com/150' }}
                  style={styles.storeLogo}
                />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>{store?.name || 'Đang tải...'}</Text>
                  <View style={styles.storeLevel}>
                    <Ionicons name="ribbon" size={12} color="#f1c40f" />
                    <Text style={styles.levelText}>Người bán yêu thích</Text>
                  </View>
                </View>
              </View>
              <View style={styles.storeStats}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{store?.rating_summary?.average || '5.0'}</Text>
                  <Text style={styles.miniStatLabel}>Đánh giá</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{summary.totalProducts || 0}</Text>
                  <Text style={styles.miniStatLabel}>Sản phẩm</Text>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.miniStat}
                  onPress={() => store?._id && router.push(`/store/${store._id}` as any)}
                >
                  <Ionicons name="arrow-forward-circle" size={20} color="#ee4d2d" />
                  <Text style={styles.miniStatLabel}>Xem Shop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>Tính năng</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { id: 'orders', label: 'Đơn hàng', icon: 'list-outline', color: '#3498db', route: '/(seller)/orders' },
              { id: 'products', label: 'Sản phẩm', icon: 'pricetag-outline', color: '#2ecc71', route: '/(seller)/products' },
              { id: 'inventory', label: 'Kho hàng', icon: 'cube-outline', color: '#e67e22', route: '/(seller)/inventory' },
              { id: 'vouchers', label: 'Voucher', icon: 'ticket-outline', color: '#ff7337', route: '/(seller)/vouchers' },
              { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline', color: '#9b59b6', route: '/(seller)/chat' },
              { id: 'reviews', label: 'Đánh giá', icon: 'star-outline', color: '#f1c40f', route: '/(seller)/reviews' },
              { id: 'wallet', label: 'Ví', icon: 'wallet-outline', color: '#e74c3c', route: '/(seller)/wallet' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Performance Summary */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hiệu quả hoạt động</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.seeMore}>Cập nhật mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconHeader}>
                <Ionicons name="cash-outline" size={20} color="#ee4d2d" />
                <Text style={styles.statTrend}>+4.2%</Text>
              </View>
              <Text style={styles.statMainValue}>{(summary.totalRevenue || 0).toLocaleString('vi-VN')}₫</Text>
              <Text style={styles.statCardLabel}>Tổng doanh thu</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconHeader}>
                <Ionicons name="cart-outline" size={20} color="#3498db" />
                <View style={[styles.trendBadge, { backgroundColor: '#e8f5e9' }]}>
                  <Text style={[styles.statTrend, { color: '#4caf50' }]}>Tăng</Text>
                </View>
              </View>
              <Text style={styles.statMainValue}>{summary.totalOrders || 0}</Text>
              <Text style={styles.statCardLabel}>Tổng đơn hàng</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconHeader}>
                <Ionicons name="time-outline" size={20} color="#f1c40f" />
              </View>
              <Text style={styles.statMainValue}>{summary.pendingOrders || 0}</Text>
              <Text style={styles.statCardLabel}>Chờ xác nhận</Text>
            </View>

            <TouchableOpacity
              style={[styles.statCard, lowStockCount > 0 && { borderColor: '#ee4d2d', borderWidth: 1 }]}
              onPress={() => router.push('/(seller)/inventory')}
            >
              <View style={styles.statIconHeader}>
                <Ionicons name="alert-circle-outline" size={20} color={lowStockCount > 0 ? "#ee4d2d" : "#9b59b6"} />
                {lowStockCount > 0 && (
                  <View style={[styles.trendBadge, { backgroundColor: '#fdf2f2' }]}>
                    <Text style={[styles.statTrend, { color: '#ee4d2d' }]}>Cần nhập</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.statMainValue, lowStockCount > 0 && { color: '#ee4d2d' }]}>{lowStockCount}</Text>
              <Text style={styles.statCardLabel}>Sản phẩm sắp hết</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcfc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  notifBtn: {
    padding: 4,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ee4d2d',
  },
  headerBadgeText: {
    color: '#ee4d2d',
    fontSize: 9,
    fontWeight: 'bold',
  },
  storeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#ee4d2d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  storeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#eee',
  },
  storeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  storeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111',
  },
  storeLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  levelText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  storeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 15,
  },
  seeMore: {
    fontSize: 13,
    color: '#ee4d2d',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionItem: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statMainValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#888',
  },
  statTrend: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ee4d2d',
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
  }
});
