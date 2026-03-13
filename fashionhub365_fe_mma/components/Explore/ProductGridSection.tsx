import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import listingApi from '../../apis/listingApi';
import { IconSymbol } from '../ui/icon-symbol';
import { getProductMainImage } from '../../utils/helpers';

export default function ProductGridSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: 20,
        page: 1,
        sort: 'newest',
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      };
      
      const res = await listingApi.getProducts(params);
      // @ts-ignore
      if (res && res.success) {
        // @ts-ignore
        setProducts(res.data.products);
      }
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError('Cannot load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const renderProduct = ({ item }: { item: any }) => {
    const defaultImage = getProductMainImage(item);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/product/${item._id || item.uuid}`)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: defaultImage }} style={styles.image} />
        <View style={styles.cardInfo}>
          <Text style={styles.brand}>{item.brand || 'BRAND'}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>{item.base_price?.toLocaleString('vi-VN')}₫</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <IconSymbol name="xmark.circle.fill" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id || item.uuid || Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 15,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  card: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#f9f9f9',
  },
  cardInfo: {
    paddingTop: 10,
  },
  brand: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  }
});
