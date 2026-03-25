import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
// @ts-ignore
import { getSellerProducts, toggleStockStatus, deleteProduct } from '../../services/productService';
import { getProductMainImage } from '../../utils/helpers';

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
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
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { 
    loadProducts(); 
  }, [loadProducts]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const confirmDelete = (product: any) => {
    Alert.alert(
      "Xóa sản phẩm?",
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
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xóa sản phẩm');
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
      Alert.alert('Lỗi', 'Lỗi khi cập nhật trạng thái: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };



  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#4caf50';
      case 'inactive': return '#f44336';
      case 'draft': return '#9e9e9e';
      case 'blocked': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'ĐANG BÁN';
      case 'inactive': return 'ĐÃ ẨN';
      case 'draft': return 'NHÁP';
      case 'blocked': return 'BỊ KHÓA';
      default: return status.toUpperCase();
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const isToggling = togglingId === item._id;
    const isActive = item.status === 'active';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: getProductMainImage(item) }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.uuid}>#{item.uuid?.substring(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
               <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                 {getStatusLabel(item.status)}
               </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Giá bán</Text>
            <Text style={styles.value}>{item.base_price?.toLocaleString('vi-VN')}₫</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Phân loại</Text>
            <Text style={styles.value}>{item.variants?.length || 0}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Còn hàng</Text>
            <TouchableOpacity 
              onPress={() => handleToggleStock(item)}
              disabled={isToggling || item.status === 'blocked'}
              style={[styles.toggleBtn, isActive ? styles.toggleActive : styles.toggleInactive]}
            >
              <Text style={styles.toggleText}>{isActive ? 'CÓ' : 'KHÔNG'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push({ pathname: '/(seller)/product-form', params: { id: item._id } })}
          >
            <IconSymbol name="pencil.circle" size={24} color="#4a90e2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item)}>
            <IconSymbol name="trash.circle" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sản phẩm ({total})</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(seller)/product-form')}>
          <Text style={styles.addBtnText}>+ Thêm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    paddingHorizontal: 15,
    paddingBottom: 20,
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
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  uuid: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailItem: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toggleActive: {
    backgroundColor: '#e8f5e9',
  },
  toggleInactive: {
    backgroundColor: '#ffebee',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionBtn: {
    padding: 5,
    marginLeft: 15,
  }
});
