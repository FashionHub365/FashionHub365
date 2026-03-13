import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import storeApi from '../../apis/store.api';
import listingApi from '../../apis/listingApi';
import { getProductMainImage } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchStore = async () => {
      setLoading(true);
      setError('');
      try {
        const storeRes = await listingApi.getStoreById(id as string);
        if (storeRes && (storeRes as any).success) {
          setStore((storeRes as any).data);
          
          // Fetch products for this store
          const prodRes = await listingApi.getProducts({ store: (storeRes as any).data._id, limit: 10, sort: 'newest' });
          if (prodRes && (prodRes as any).success) {
            setProducts((prodRes as any).data.products);
          }
        }
      } catch (err: any) {
        console.error('Fetch store detail error:', err);
        setError('Cannot load store details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  useEffect(() => {
    if (store?._id) {
       storeApi.getFollowingStatus(store._id).then(res => {
         if (res && (res as any).success) setIsFollowing((res as any).data.isFollowing);
       }).catch(() => {});
    }
  }, [store?._id]);

  const handleToggleFollow = async () => {
    if (!store?._id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await storeApi.unfollowStore(store._id);
        if ((res as any).success) setIsFollowing(false);
      } else {
        const res = await storeApi.followStore(store._id);
        if ((res as any).success) setIsFollowing(true);
      }
    } catch (e) {
      console.log('Follow error:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !store) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Store not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const storeName = store.name || store.owner_user_id?.profile?.full_name || 'Store';
  const bannerImg = store.information?.banner || store.information?.coverImage || FALLBACK_BANNER;
  const logoImg = store.information?.logo || null;
  const description = store.information?.description || "Welcome to our store!";
  
  const renderProduct = ({ item }: { item: any }) => {
    const defaultImage = getProductMainImage(item);
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/product/${item._id || item.uuid}`)}
      >
        <Image source={{ uri: defaultImage }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.base_price?.toLocaleString('vi-VN')}₫</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Over Banner */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{storeName}</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        ListHeaderComponent={() => (
          <>
            {/* Banner Section */}
            <View style={styles.bannerContainer}>
              <Image source={{ uri: bannerImg }} style={styles.bannerImage} />
              <View style={styles.profileOverlay}>
                <View style={styles.logoContainer}>
                  {logoImg ? (
                    <Image source={{ uri: logoImg }} style={styles.logoImg} />
                  ) : (
                    <Text style={styles.logoText}>{storeName.charAt(0)}</Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{storeName}</Text>
                  <Text style={styles.profileStats}>
                    {store.rating?.average?.toFixed(1) || '0.0'} ★ • {store.metrics?.follower_count || 0} Followers
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions & Description */}
            <View style={styles.detailsContainer}>
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.followBtn, isFollowing && styles.followBtnActive]} 
                  onPress={handleToggleFollow}
                  disabled={followLoading}
                >
                  <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                    {isFollowing ? 'Following' : '+ Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.description}>{description}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Latest Products</Text>
          </>
        )}
        data={products}
        keyExtractor={(item) => item._id || item.uuid || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
           <Text style={styles.emptyProducts}>This store hasn't posted any products yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBackBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  bannerContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#eee',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  profileOverlay: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#888',
  },
  profileInfo: {
    marginLeft: 15,
    marginBottom: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  profileStats: {
    fontSize: 13,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  detailsContainer: {
    padding: 20,
    paddingTop: 45,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  followBtn: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followBtnActive: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  followBtnTextActive: {
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  listContainer: {
    paddingBottom: 30,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  card: {
    width: '48%',
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: (width * 0.48) * 1.25, // 4:5 aspect ratio roughly
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  cardInfo: {
    marginTop: 8,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  emptyProducts: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontStyle: 'italic',
  }
});
