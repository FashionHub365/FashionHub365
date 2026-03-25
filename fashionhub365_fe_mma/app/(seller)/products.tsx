import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore
import { getSellerProducts, toggleStockStatus, deleteProduct } from '../../services/productService';
import { getProductMainImage } from '../../utils/helpers';

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;

      const data = await getSellerProducts(params);
      // @ts-ignore
      const result = data?.data || data || {};
      setProducts(result.products || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      console.error('Error loading products:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const confirmDelete = (product: any) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa "${product.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product._id);
              Alert.alert('Thành công', 'Đã xóa sản phẩm.');
              loadProducts();
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            }
          }
        }
      ]
    );
  };

  const handleToggleStock = async (product: any) => {
    setTogglingId(product._id);
    try {
      await toggleStockStatus(product._id);
      loadProducts();
    } catch (err: any) {
      Alert.alert('Lỗi', 'Lỗi khi cập nhật trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2ecc71';
      case 'inactive': return '#e74c3c';
      case 'draft': return '#95a5a6';
      case 'blocked': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang bán';
      case 'inactive': return 'Đã ẩn';
      case 'draft': return 'Nháp';
      case 'blocked': return 'Bị khóa';
      default: return status;
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const isToggling = togglingId === item._id;
    const isActive = item.status === 'active';

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <Image source={{ uri: getProductMainImage(item) }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.skuRow}>
              <Text style={styles.skuText}>SKU: {item.uuid?.substring(0, 8).toUpperCase()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Giá bán</Text>
            <Text style={styles.statValue}>{item.base_price?.toLocaleString('vi-VN')}₫</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Kho hàng</Text>
            <Text style={styles.statValue}>{item.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã bán</Text>
            <Text style={styles.statValue}>{item.sold_count || 0}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <View style={styles.statusToggle}>
            <Text style={styles.toggleLabel}>{isActive ? 'Đang hiển thị' : 'Đang ẩn'}</Text>
            <TouchableOpacity
              onPress={() => handleToggleStock(item)}
              disabled={isToggling || item.status === 'blocked'}
              style={[styles.switchTrack, isActive ? styles.switchActive : styles.switchInactive]}
            >
              <View style={[styles.switchThumb, isActive ? styles.thumbActive : styles.thumbInactive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push({ pathname: '/(seller)/product-form', params: { id: item._id } })}
            >
              <Ionicons name="create-outline" size={22} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
              <Ionicons name="trash-outline" size={22} color="#e74c3c" />
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
        <Text style={styles.headerTitle}>Sản phẩm ({total})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(seller)/product-form')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ee4d2d" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={60} color="#ddd" />
          <Text style={styles.emptyText}>Bạn chưa có sản phẩm nào.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ee4d2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardMain: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    lineHeight: 20,
    marginBottom: 6,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skuText: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  switchTrack: {
    width: 36,
    height: 18,
    borderRadius: 9,
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#ee4d2d',
  },
  switchInactive: {
    backgroundColor: '#ddd',
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  thumbInactive: {
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  }
});
