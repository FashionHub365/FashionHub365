import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import listingApi from '../../apis/listingApi';
import { getProductMainImage } from '../../utils/helpers';

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await listingApi.getProducts({ limit: 5, sort: 'newest' });
        if (res && (res as any).success) {
          setProducts((res as any).data.products);
        }
      } catch (error) {
        console.error('Fetch new arrivals error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/product/${item._id || item.uuid}` as any)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: getProductMainImage(item) }} style={styles.image} />
      <View style={styles.cardInfo}>
        <Text style={styles.brand}>{item.brand || 'BRAND'}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>{item.base_price?.toLocaleString('vi-VN')}₫</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Arrivals</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#000" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id || item.uuid || Math.random().toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  seeAll: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },
  loader: {
    marginVertical: 40,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  card: {
    width: 160,
    marginHorizontal: 5,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
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
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  }
});
