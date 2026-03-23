import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import adminApi from '../../apis/adminApi';

const TABS = [
  { id: 'pending', label: 'Chờ duyệt', icon: 'time-outline' },
  { id: 'approved', label: 'Đã duyệt', icon: 'checkmark-circle-outline' },
  { id: 'rejected', label: 'Bị từ chối', icon: 'close-circle-outline' },
];

export default function StoreManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSellerRequests({ status: activeTab, limit: 50 });
      if ((res as any).success) {
        setRequests((res as any).data.sellerRequests || []);
      }
    } catch (error) {
      console.error('Fetch seller requests error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const renderRequest = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.storeLogoBox}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.storeLogo} />
          ) : (
            <Ionicons name="storefront-outline" size={24} color="#1a73e8" />
          )}
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeOwner}>Chủ: {item.owner_user_id?.profile?.full_name || item.owner_user_id?.username}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeTab) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(activeTab) }]}>
            {activeTab === 'pending' ? 'Pending' : activeTab === 'approved' ? 'Active' : 'Rejected'}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={14} color="#666" />
          <Text style={styles.contactText}>{item.email || item.owner_user_id?.email}</Text>
        </View>
        {item.phone && (
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const getStatusColor = (tab: string) => {
    if (tab === 'approved') return '#4caf50';
    if (tab === 'pending') return '#fb8c00';
    if (tab === 'rejected') return '#f44336';
    return '#888';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Cửa hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? '#1a73e8' : '#888'} 
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>Không có cửa hàng nào.</Text>
            </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1a73e8',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
  },
  activeTabLabel: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeLogoBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storeOwner: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
    fontSize: 14,
  }
});
