import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import adminApi from '../../apis/adminApi';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      if ((res as any).success) {
        setStats((res as any).data);
      }
    } catch (error) {
      console.error('Fetch admin stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  const summary = stats?.summary || {};
  const recentOrders = stats?.recentOrders || [];
  const trend = stats?.trend || {};

  const StatCard = ({ title, value, icon, color, growth, suffix = '' }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value.toLocaleString('vi-VN')}{suffix}</Text>
        {growth !== undefined && (
          <View style={styles.trendRow}>
            <Ionicons
              name={growth >= 0 ? "trending-up" : "trending-down"}
              size={12}
              color={growth >= 0 ? "#4caf50" : "#f44336"}
            />
            <Text style={[styles.trendText, { color: growth >= 0 ? "#4caf50" : "#f44336" }]}>
              {Math.abs(growth).toFixed(1)}% so với tháng trước
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
          <Ionicons name="refresh" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số quan trọng</Text>
          <View style={styles.statGrid}>
            <StatCard
              title="Tổng Doanh Thu"
              value={summary.totalRevenue || 0}
              icon="cash-outline"
              color="#1a73e8"
              growth={trend.revenue}
              suffix="₫"
            />
            <StatCard
              title="Đơn Hàng"
              value={summary.totalOrders || 0}
              icon="cart-outline"
              color="#fb8c00"
              growth={trend.orders}
            />
            <StatCard
              title="Khách Hàng"
              value={summary.totalUsers || 0}
              icon="people-outline"
              color="#4caf50"
              growth={trend.users}
            />
            <StatCard
              title="Sản Phẩm"
              value={summary.totalProducts || 0}
              icon="shirt-outline"
              color="#e91e63"
            />
          </View>
        </View>

        {/* Management Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công cụ quản lý</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(admin)/users')}>
              <View style={[styles.gridIcon, { backgroundColor: '#e8f0fe' }]}>
                <Ionicons name="people" size={24} color="#1a73e8" />
              </View>
              <Text style={styles.gridLabel}>Người dùng</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(admin)/stores')}>
              <View style={[styles.gridIcon, { backgroundColor: '#e6f4ea' }]}>
                <Ionicons name="storefront" size={24} color="#34a853" />
              </View>
              <Text style={styles.gridLabel}>Cửa hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(admin)/products')}>
              <View style={[styles.gridIcon, { backgroundColor: '#fce4ec' }]}>
                <Ionicons name="shirt" size={24} color="#e91e63" />
              </View>
              <Text style={styles.gridLabel}>Sản phẩm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(admin)/categories')}>
              <View style={[styles.gridIcon, { backgroundColor: '#e0f7fa' }]}>
                <Ionicons name="list" size={24} color="#00bcd4" />
              </View>
              <Text style={styles.gridLabel}>Danh mục</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(admin)/audit-logs')}>
              <View style={[styles.gridIcon, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="document-text" size={24} color="#fb8c00" />
              </View>
              <Text style={styles.gridLabel}>Nhật ký</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Revenue Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Xu hướng doanh thu sàn</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Chi tiết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {stats?.monthlyPlatformStats?.length > 0 ? (
                (() => {
                  const data = stats.monthlyPlatformStats.slice(-6);
                  const maxRevenue = Math.max(...data.map((m: any) => m.netRevenue || 0)) || 1;
                  return data.map((m: any) => (
                    <View key={`${m._id.year}-${m._id.month}`} style={styles.barColumn}>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${((m.netRevenue || 0) / maxRevenue) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{m._id.month}/{m._id.year.toString().slice(-2)}</Text>
                    </View>
                  ));
                })()
              ) : (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>Chưa có dữ liệu biểu đồ.</Text>
                </View>
              )}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1a73e8' }]} />
                <Text style={styles.legendText}>Doanh thu thực nhận (Net)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'completed') return '#4caf50';
  if (s === 'pending' || s === 'pending_payment') return '#fb8c00';
  if (s === 'cancelled' || s === 'failed') return '#f44336';
  return '#9e9e9e';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    marginLeft: 4,
  },
  toolGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toolBtn: {
    alignItems: 'center',
    flex: 1,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
    paddingBottom: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 16,
    height: '100%',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 8,
  },
  chartLegend: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  orderMeta: {
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 12,
    color: '#666',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  }
});
