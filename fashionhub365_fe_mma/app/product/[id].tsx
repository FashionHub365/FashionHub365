import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import listingApi from '../../apis/listingApi';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a", white: "#ffffff", blue: "#21558d", brown: "#925c37",
  green: "#585b45", grey: "#e1e1e3", gray: "#e1e1e3", orange: "#d38632",
  pink: "#efcec9", red: "#bd2830", tan: "#b3a695", navy: "#1b2a4a",
  beige: "#f5e6c8", yellow: "#f5c842", purple: "#6b2fa0",
};

function getColorHex(colorName: string) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await listingApi.getProductById(id as string);
        if (res && (res as any).success) {
          setProduct((res as any).data);
          listingApi.trackView(id as string).catch(() => {});
        }
      } catch (err: any) {
        console.error('Fetch product detail error:', err);
        setError('Cannot find product or an error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColorIndex]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DATA MAPPING ---
  const productImages = product.media?.length
    ? [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' }];

  const colorVariantsObj = product.variants?.filter((v: any) => v.attributes?.color).reduce((acc: any, v: any) => {
    if (!acc[v.attributes.color]) {
      acc[v.attributes.color] = { name: v.attributes.color, color: getColorHex(v.attributes.color) };
    }
    return acc;
  }, {}) || {};
  const colorVariants = Object.values(colorVariantsObj) as any[];

  const sizeVariants = (product.variants
    ? [...new Set(product.variants.filter((v: any) => v.attributes?.size).map((v: any) => v.attributes.size))]
    : []) as string[];

  const selectedColor = colorVariants[selectedColorIndex]?.name;
  
  const matchedVariant = product.variants?.find(
    (v: any) => v.attributes?.color === selectedColor && (selectedSize ? v.attributes?.size === selectedSize : true)
  ) || product.variants?.[0];

  const currentStock = matchedVariant?.stock ?? null;
  const isOutOfStock = currentStock !== null && currentStock === 0;

  const originalPrice = product.base_price || 0;
  const salePrice = matchedVariant?.price || originalPrice;
  const storeName = product.store_id?.owner_user_id?.profile?.full_name || product.store_id?.name || 'Partner Store';
  const categoryName = product.primary_category_id?.name || '';
  const rating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const soldCount = product.sold_count || 0;

  // --- ACTIONS ---
  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Required', 'Please select a size first.');
      return;
    }
    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }
    const variant = product.variants?.find(
      (v: any) => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize
    );
    if (!variant) {
      Alert.alert('Error', 'Variant not found.');
      return;
    }

    const result = await addToCart(product._id, variant._id, quantity);
    if (!result.success) {
      Alert.alert('Error', result.message);
    } else {
      Alert.alert('Success', 'Added to cart successfully!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.headerCartBtn}>
          <IconSymbol name="cart" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images Carousel */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {productImages.map((img: any, idx: number) => (
            <Image key={idx} source={{ uri: img.url }} style={styles.productImage} resizeMode="contain" />
          ))}
        </ScrollView>
        {salePrice < originalPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% OFF</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.category}>{categoryName.toUpperCase()}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{salePrice.toLocaleString('vi-VN')}₫</Text>
            {salePrice < originalPrice && (
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString('vi-VN')}₫</Text>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <IconSymbol name="star.fill" size={14} color="#f5c842" />
              <Text style={styles.ratingText}>{rating.toFixed(1)} ({reviewCount})</Text>
            </View>
            {soldCount > 0 && <Text style={styles.soldText}>{soldCount.toLocaleString()} sold</Text>}
          </View>

          {/* Store Info */}
          <TouchableOpacity style={styles.storeCard} onPress={() => router.push(`/store/${product.store_id?._id || product.store_id}` as any)}>
            <View style={styles.storeAvatarFallback}>
              <Text style={styles.storeAvatarText}>{storeName.charAt(0)}</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>Seller</Text>
              <Text style={styles.storeName}>{storeName}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Color Selection */}
          {colorVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color: <Text style={{fontWeight: 'normal'}}>{selectedColor}</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                {colorVariants.map((colorItem, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColorIndex(idx)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: colorItem.color },
                      selectedColorIndex === idx && styles.colorCircleSelected
                    ]}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Size Selection */}
          {sizeVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Size</Text>
              <View style={styles.sizeGrid}>
                {sizeVariants.map((s: string, idx: number) => {
                  const sizeStock = product.variants?.find((v: any) => v.attributes?.color === selectedColor && v.attributes?.size === s)?.stock ?? null;
                  const isSizeEmpty = sizeStock !== null && sizeStock <= 0;
                  const isSelected = selectedSize === s;

                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={isSizeEmpty}
                      onPress={() => setSelectedSize(s)}
                      style={[
                        styles.sizeBox,
                        isSelected && styles.sizeBoxSelected,
                        isSizeEmpty && styles.sizeBoxDisabled
                      ]}
                    >
                      <Text style={[
                        styles.sizeText,
                        isSelected && styles.sizeTextSelected,
                        isSizeEmpty && styles.sizeTextDisabled
                      ]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Stock & Quantity */}
          {selectedSize && (
            <View style={styles.quantitySection}>
              {isOutOfStock ? (
                <Text style={styles.outOfStockText}>Out of stock</Text>
              ) : (
                <View>
                  <Text style={styles.stockText}>
                    {currentStock && currentStock <= 5 ? `Only ${currentStock} left!` : `${currentStock} available`}
                  </Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity 
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => setQuantity(Math.min(currentStock ?? 99, quantity + 1))}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.addToCartBtn, (isOutOfStock || cartLoading) && styles.addToCartDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || cartLoading}
        >
          {cartLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerCartBtn: {
    padding: 5,
  },
  imageScroll: {
    width,
    height: width * 1.2,
    backgroundColor: '#f9f9f9',
  },
  productImage: {
    width,
    height: width * 1.2,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  category: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
  },
  soldText: {
    fontSize: 14,
    color: '#555',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#eee',
  },
  storeAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  storeAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#000',
    transform: [{ scale: 1.1 }],
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  sizeBoxSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeBoxDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  sizeText: {
    fontSize: 15,
    color: '#333',
  },
  sizeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sizeTextDisabled: {
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  quantitySection: {
    marginBottom: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stockText: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 10,
  },
  outOfStockText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    color: '#555',
  },
  qtyValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  bottomBar: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addToCartBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
