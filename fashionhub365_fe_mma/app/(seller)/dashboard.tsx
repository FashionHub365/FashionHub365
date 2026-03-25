import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { getStoreStats } from '../../services/orderService';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { router } from 'expo-router';
// @ts-ignore
import storeApi from '../../apis/store.api';

export default function SellerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const data = await getStoreStats();
        if (!active) return;
        // @ts-ignore
        setStats(data?.data || data || {});

        const storeResponse = await storeApi.getMyStore();
        if (active) {
            setStore(storeResponse?.data?.store || storeResponse?.data || storeResponse);
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('Could not load data. Please check connection.');
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchStats();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f39c12" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => {/* reload */}}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary = {} } = stats || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kênh Người Bán</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Navigation Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLinkBtn} onPress={() => router.push('/(seller)/orders')}>
            <IconSymbol name="list.bullet.rectangle.portrait" size={24} color="#f39c12" />
            <Text style={styles.quickLinkText}>Quản lý đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLinkBtn} onPress={() => router.push('/(seller)/products')}>
            <IconSymbol name="tag.fill" size={24} color="#f39c12" />
            <Text style={styles.quickLinkText}>Sản phẩm</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickLinkBtn} 
            onPress={() => {
              if (store?._id) {
                router.push(`/store/${store._id}` as any);
              }
            }}
          >
            <IconSymbol name="storefront.fill" size={24} color="#f39c12" />
            <Text style={styles.quickLinkText}>Xem Shop</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>Tổng quan</Text>
        <View style={styles.statsGrid}>
          
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color="#4caf50" />
            </View>
            <Text style={styles.statLabel}>Tổng doanh thu</Text>
            <Text style={styles.statValue}>{summary.totalRevenue?.toLocaleString('vi-VN') || 0}₫</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
              <IconSymbol name="cart.fill" size={24} color="#2196f3" />
            </View>
            <Text style={styles.statLabel}>Tổng đơn hàng</Text>
            <Text style={styles.statValue}>{summary.totalOrders || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
              <IconSymbol name="timer" size={24} color="#ff9800" />
            </View>
            <Text style={styles.statLabel}>Đơn chờ xử lý</Text>
            <Text style={styles.statValue}>{summary.pendingOrders || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}>
              <IconSymbol name="cube.box.fill" size={24} color="#9c27b0" />
            </View>
            <Text style={styles.statLabel}>Tổng sản phẩm</Text>
            <Text style={styles.statValue}>{summary.totalProducts || 0}</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 15,
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickLinkText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
