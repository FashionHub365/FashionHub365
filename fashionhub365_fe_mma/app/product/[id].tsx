import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, FlatList, StatusBar, Modal, TextInput
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import listingApi from '../../apis/listingApi';
import wishlistApi from '../../apis/wishlistApi';
import marketingApi from '../../apis/marketingApi';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ui/ProductCard';
import VoucherCard from '../../components/ui/VoucherCard';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.15;

const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a', white: '#f9f9f9', blue: '#3a6bc8', brown: '#925c37',
  green: '#4a7c59', grey: '#b0b0b0', gray: '#b0b0b0', orange: '#e87c2c',
  pink: '#e8a0a0', red: '#c0392b', tan: '#b3a695', navy: '#1b2a4a',
  beige: '#f5e6c8', yellow: '#f5c842', purple: '#7b3fa0',
};

function getColorHex(colorName: string) {
  if (!colorName) return '#cccccc';
  return COLOR_MAP[colorName.toLowerCase()] || '#cccccc';
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);

  // Phase 6 State
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Voucher State
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  const toggleWishlist = async () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist(product._id);
        setIsWishlisted(false);
      } else {
        await wishlistApi.addToWishlist(product._id);
        setIsWishlisted(true);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng tính năng này.');
    }
  };
  const flatListRef = useRef<FlatList>(null);
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
          listingApi.trackView(id as string).catch(() => { });
        }

        // Fetch reviews
        try {
          setReviewsLoading(true);
          const revRes = await listingApi.getProductReviews(id as string);
          if (revRes && (revRes as any).success) {
            setReviews((revRes as any).data?.items || []);
          }
        } catch (err) {
          console.log('Error fetching reviews', err);
        } finally {
          setReviewsLoading(false);
        }

        // Fetch similar products
        if ((res as any).data?.primary_category_id?._id) {
          fetchSimilarProducts((res as any).data.primary_category_id._id);
        }

        // Fetch vouchers
        if ((res as any).data?.store_id?._id || (res as any).data?.store_id) {
          const sId = (res as any).data.store_id?._id || (res as any).data.store_id;
          fetchVouchers(sId);
        }

      } catch (err: any) {
        setError('Không tìm thấy sản phẩm hoặc có lỗi xảy ra.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColorIndex]);

  const fetchSimilarProducts = async (categoryId: string) => {
    setSimilarLoading(true);
    try {
      const res = await listingApi.getProducts({ category: categoryId, limit: 10 });
      if (res && (res as any).success) {
        // Filter out current product
        const filtered = ((res as any).data?.products || []).filter((p: any) => p._id !== id);
        setSimilarProducts(filtered);
      }
    } catch (err) {
      console.log('Error fetching similar products', err);
    } finally {
      setSimilarLoading(false);
    }
  };

  const fetchVouchers = async (storeId: string) => {
    setVouchersLoading(true);
    try {
      const res = await marketingApi.getVouchers({ store_id: storeId, status: 'active' });
      if (res && (res as any).success) {
        setVouchers((res as any).data?.items || []);
      }
    } catch (err: any) {
      if (err.message?.includes('No refresh token')) return;
      console.log('Error fetching vouchers', err);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleClaimVoucher = async (voucherId: string) => {
    try {
      const res = await marketingApi.claimVoucher(voucherId);
      if (res && (res as any).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thành công', 'Voucher đã được lưu vào ví của bạn!');
        // Update local state
        setVouchers(prev => prev.map(v => v._id === voucherId ? { ...v, isClaimed: true } : v));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể lấy voucher. Vui lòng thử lại.';
      Alert.alert('Thông báo', msg);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#111" />
        <Text style={{ marginTop: 16, color: '#888', fontSize: 14 }}>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy sản phẩm'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DATA MAPPING ---
  const productImages = product.media?.length
    ? [...product.media].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [{ url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80' }];

  const colorVariantsObj = product.variants?.filter((v: any) => v.attributes?.color).reduce((acc: any, v: any) => {
    if (!acc[v.attributes.color]) {
      acc[v.attributes.color] = { name: v.attributes.color, hex: getColorHex(v.attributes.color) };
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
  const hasDiscount = salePrice < originalPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
  const storeName = product.store_id?.name || product.store_id?.owner_user_id?.profile?.full_name || 'FashionHub Store';
  const categoryName = product.primary_category_id?.name || '';
  const rating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const soldCount = product.sold_count || 0;

  const handleAddToCart = async () => {
    if (!selectedSize && sizeVariants.length > 0) {
      Alert.alert('Chọn size', 'Vui lòng chọn kích thước trước.');
      return;
    }
    if (isOutOfStock) {
      Alert.alert('Hết hàng', 'Sản phẩm này hiện đã hết hàng.');
      return;
    }
    const variant = product.variants?.find(
      (v: any) => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize
    ) || product.variants?.[0];

    if (!variant) {
      Alert.alert('Lỗi', 'Không tìm thấy phiên bản sản phẩm.');
      return;
    }

    const result = await addToCart(product._id, variant._id, quantity);
    if (!result.success) {
      Alert.alert('Lỗi', result.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓ Đã thêm!', `${product.name} đã được thêm vào giỏ hàng.`, [
        { text: 'Tiếp tục mua sắm' },
        { text: 'Xem Giỏ Hàng', onPress: () => router.push('/(tabs)/cart') }
      ]);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao để đánh giá.');
      return;
    }
    setSubmitReviewLoading(true);
    try {
      const payload = { rating: reviewRating, comment: reviewComment.trim() };
      const res = await listingApi.createProductReview(id as string, payload);
      if (res && (res as any).success) {
        Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá sản phẩm!');
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);

        // Refresh reviews
        setReviewsLoading(true);
        const revRes = await listingApi.getProductReviews(id as string);
        if (revRes && (revRes as any).success) {
          setReviews((revRes as any).data?.items || []);
        }
        setReviewsLoading(false);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitReviewLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerRightBtns}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setIsWishlisted(!isWishlisted)}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? '#E53935' : '#111'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { marginLeft: 8 }]} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="bag-outline" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Gallery */}
        <View style={{ position: 'relative' }}>
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={productImages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }: { item: any, index: number }) => (
              <View key={index.toString()}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {/* Video Play Overlay for the first image */}
                {index === 0 && (
                  <View style={styles.videoOverlay}>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                    <Text style={styles.videoDuration}>0:15</Text>
                  </View>
                )}
              </View>
            )}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(idx);
            }}
          />
          {/* Dots indicator */}
          {productImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {productImages.map((_: any, i: number) => (
                <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
          {/* Discount badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Category + name */}
          {categoryName ? <Text style={styles.category}>{categoryName.toUpperCase()}</Text> : null}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{salePrice.toLocaleString('vi-VN')}₫</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString('vi-VN')}₫</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {rating > 0 && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={13} color="#FFB800" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({reviewCount} đánh giá)</Text>
              </View>
            )}
            {soldCount > 0 && (
              <View style={styles.soldPill}>
                <Text style={styles.soldText}>Đã bán {soldCount.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Voucher Section */}
          {vouchers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ưu đãi của Shop</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {vouchers.map((v) => (
                  <VoucherCard
                    key={v._id}
                    voucher={v}
                    compact
                    isClaimed={v.isClaimed}
                    onClaim={handleClaimVoucher}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Store Info */}
          <TouchableOpacity
            style={styles.storeCard}
            onPress={() => router.push(`/store/${product.store_id?._id || product.store_id}` as any)}
          >
            <View style={styles.storeAvatar}>
              <Text style={styles.storeAvatarText}>{storeName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>Cửa hàng</Text>
              <Text style={styles.storeName}>{storeName}</Text>
            </View>
            <View style={styles.visitStoreBadge}>
              <Text style={styles.visitStoreText}>Ghé thăm</Text>
            </View>
          </TouchableOpacity>

          {/* Color Selection */}
          {colorVariants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Màu sắc</Text>
                <Text style={styles.selectedLabel}>{selectedColor}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {colorVariants.map((c: any, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColorIndex(idx)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.hex },
                      selectedColorIndex === idx && styles.colorCircleSelected
                    ]}
                  >
                    {selectedColorIndex === idx && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={c.hex === '#f9f9f9' || c.hex === '#f5e6c8' ? '#333' : '#fff'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Size Selection */}
          {sizeVariants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Kích cỡ</Text>
                <TouchableOpacity onPress={() => setShowSizeChart(true)}>
                  <Text style={styles.sizeChartLink}>Bảng quy đổi kích cỡ</Text>
                </TouchableOpacity>
              </View>
              {selectedSize && <Text style={[styles.selectedLabel, { marginBottom: 10 }]}>{selectedSize}</Text>}
              <View style={styles.sizeGrid}>
                {sizeVariants.map((s: string, idx: number) => {
                  const sizeStock = product.variants?.find((v: any) =>
                    v.attributes?.color === selectedColor && v.attributes?.size === s
                  )?.stock ?? null;
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
                      ]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity */}
          {(!isOutOfStock) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Số lượng</Text>
                {currentStock !== null && currentStock > 0 && (
                  <Text style={[styles.selectedLabel, currentStock <= 5 && { color: '#E53935' }]}>
                    {currentStock <= 5 ? `Chỉ còn ${currentStock}!` : `Còn ${currentStock}`}
                  </Text>
                )}
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="remove" size={20} color="#111" />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.min(currentStock ?? 99, quantity + 1))}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="add" size={20} color="#111" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockBanner}>
              <Ionicons name="alert-circle" size={18} color="#E53935" />
              <Text style={styles.outOfStockText}>Sản phẩm hiện đã hết hàng</Text>
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                <Text style={styles.writeReviewText}>Viết đánh giá</Text>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#111" style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.noReviewText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
            ) : (
              reviews.map((r: any, idx: number) => (
                <View key={idx} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Ionicons name="person" size={16} color="#888" />
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{r.user_id?.profile?.full_name || r.user_id?.username || 'Khách hàng'}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons key={star} name="star" size={12} color={star <= r.rating ? '#FFB800' : '#E0E0E0'} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </View>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Sản phẩm tương tự</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {similarProducts.map((item) => (
                  <View key={item._id} style={{ width: 140 }}>
                    <ProductCard item={item} width={140} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, (isOutOfStock || cartLoading) && styles.addToCartDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || cartLoading}
        >
          {cartLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="bag-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addToCartText}>
                {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viết đánh giá</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Đánh giá của bạn</Text>
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={styles.ratingStarBtn}>
                  <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={32} color="#FFB800" />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Nhận xét</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, submitReviewLoading && { opacity: 0.7 }]}
              onPress={handleSubmitReview}
              disabled={submitReviewLoading}
            >
              {submitReviewLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Gửi Đánh Giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Size Chart Modal */}
      <Modal visible={showSizeChart} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSizeChart(false)}
        >
          <View style={styles.sizeChartContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bảng quy đổi kích cỡ</Text>
              <TouchableOpacity onPress={() => setShowSizeChart(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: 'https://img.freepik.com/premium-vector/measurement-guide-clothing-size-chart-vector_53562-4299.jpg' }}
              style={styles.sizeChartImage}
              resizeMode="contain"
            />
            <Text style={styles.sizeChartNote}>* Lưu ý: Kích thước thực tế có thể chênh lệch 1-2cm.</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowSizeChart(false)}>
              <Text style={styles.confirmBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView >
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
    padding: 30,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#111',
    borderRadius: 30,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // --- Floating Header ---
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerRightBtns: {
    flexDirection: 'row',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  // --- Gallery ---
  productImage: {
    width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#f5f5f5',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#111',
  },
  discountBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // --- Content ---
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  category: {
    fontSize: 11,
    color: '#aaa',
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: '600',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 10,
  },
  salePrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  originalPrice: {
    fontSize: 16,
    color: '#b0b0b0',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  soldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  soldText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  // --- Store Card ---
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  storeAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  visitStoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111',
  },
  visitStoreText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // --- Sections ---
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  selectedLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // --- Colors ---
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderColor: '#111',
    borderWidth: 3,
  },
  // --- Sizes ---
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeBox: {
    minWidth: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  sizeBoxSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  sizeBoxDisabled: {
    backgroundColor: '#F8F8F8',
    borderColor: '#EBEBEB',
  },
  sizeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sizeTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  sizeTextDisabled: {
    color: '#ccc',
  },
  // --- Quantity ---
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    width: 44,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  // --- Out of stock banner ---
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  outOfStockText: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: '600',
  },

  // Reviews styles
  writeReviewText: { color: '#3498db', fontSize: 13, fontWeight: '600' },
  noReviewText: { fontSize: 14, color: '#666', fontStyle: 'italic', marginVertical: 10 },
  reviewItem: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16, marginTop: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: '#111' },
  starsRow: { flexDirection: 'row', marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#888', marginLeft: 'auto' },
  reviewComment: { fontSize: 14, color: '#444', lineHeight: 20 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  closeBtn: { padding: 5 },
  modalLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  ratingStarsRow: { flexDirection: 'row', marginBottom: 20 },
  ratingStarBtn: { marginHorizontal: 5 },
  reviewInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 15, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  submitReviewBtn: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitReviewBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // --- Description ---
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 26,
  },
  // --- Bottom Bar ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addToCartBtn: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addToCartDisabled: {
    backgroundColor: '#b0b0b0',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Phase 6 Additional Styles
  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)'
  },
  playCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
  },
  videoDuration: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
  },
  sizeChartLink: {
    fontSize: 13, color: '#3498db', fontWeight: '600', textDecorationLine: 'underline'
  },
  sizeChartContent: {
    backgroundColor: '#fff', width: '90%', maxHeight: '80%',
    borderRadius: 20, padding: 20, alignSelf: 'center'
  },
  sizeChartImage: {
    width: '100%', height: 300, marginVertical: 10
  },
  sizeChartNote: {
    fontSize: 12, color: '#888', fontStyle: 'italic', textAlign: 'center', marginBottom: 20
  },
  confirmBtn: {
    backgroundColor: '#111', paddingVertical: 14, borderRadius: 10, alignItems: 'center'
  },
  confirmBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold'
  },
});
