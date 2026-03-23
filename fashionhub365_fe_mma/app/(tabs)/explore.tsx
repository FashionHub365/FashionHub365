import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Modal, ScrollView,
  RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import listingApi from '../../apis/listingApi';
import { getProductMainImage } from '../../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'fashionhub_search_history';

const TRENDING_SEARCHES = [
  'Áo thun nam', 'Váy hoa nhí', 'Giày sneaker',
  'Túi xách nữ', 'Quần ống rộng', 'Phụ kiện tóc'
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'best_selling', label: 'Bán chạy nhất' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sort
  const [sort, setSort] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  // Filter
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempPriceMin, setTempPriceMin] = useState('');
  const [tempPriceMax, setTempPriceMax] = useState('');

  // Advanced Search State
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await listingApi.getCategories();
        if ((res as any)?.success) setCategories((res as any).data || []);
      } catch { }
    })();
  }, []);

  // Load Search History
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch (err) {
      console.log('Load history error:', err);
    }
  };

  const saveHistory = async (newHistory: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (err) {
      console.log('Save history error:', err);
    }
  };

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    const filtered = searchHistory.filter(h => h.toLowerCase() !== cleanQuery.toLowerCase());
    const newHistory = [cleanQuery, ...filtered].slice(0, 10);
    saveHistory(newHistory);
  };

  const removeFromHistory = (query: string) => {
    const newHistory = searchHistory.filter(h => h !== query);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  // Fetch products when filters/search/sort change
  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNum,
        limit: 20,
        sort,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(selectedCategory ? { category: selectedCategory } : {}),
        ...(priceMin ? { minPrice: priceMin } : {}),
        ...(priceMax ? { maxPrice: priceMax } : {}),
      };

      const res = await listingApi.getProducts(params);
      if ((res as any)?.success) {
        const fetched = (res as any).data?.products || [];
        const total = (res as any).data?.totalPages || 1;
        setProducts(append ? prev => [...prev, ...fetched] : fetched);
        setHasMore(pageNum < total);
        setPage(pageNum);
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, sort, selectedCategory, priceMin, priceMax]);

  useEffect(() => {
    fetchProducts(1, false);
    if (debouncedSearch) {
      addToHistory(debouncedSearch);
    }
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  // Apply filter
  const applyFilter = () => {
    setSelectedCategory(tempCategory);
    setPriceMin(tempPriceMin);
    setPriceMax(tempPriceMax);
    setShowFilterModal(false);
  };

  const resetFilter = () => {
    setTempCategory(null);
    setTempPriceMin('');
    setTempPriceMax('');
    setSelectedCategory(null);
    setPriceMin('');
    setPriceMax('');
    setShowFilterModal(false);
  };

  const activeFilterCount = [selectedCategory, priceMin, priceMax].filter(Boolean).length;

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl = getProductMainImage(item);
    const price = item.base_price || 0;
    const discount = item.discount_percentage || 0;
    const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/product/${item._id || item.uuid}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{price.toLocaleString('vi-VN')}₫</Text>
            {originalPrice > 0 && (
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString('vi-VN')}₫</Text>
            )}
          </View>
          {(item.sold_count || 0) > 0 && (
            <Text style={styles.soldText}>Đã bán {item.sold_count}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Tìm sản phẩm, thương hiệu..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // Delay blur to allow clicking suggestions
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            returnKeyType="search"
            onSubmitEditing={() => addToHistory(search)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ padding: 4 }}>
            <Ionicons name="scan-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SEARCH SUGGESTIONS OVERLAY ── */}
      {isSearchFocused && (
        <View style={styles.suggestionsOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {search.trim() === '' ? (
              <>
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
                      <TouchableOpacity onPress={clearHistory}>
                        <Text style={styles.clearText}>Xoá hết</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.historyList}>
                      {searchHistory.map((item, idx) => (
                        <View key={idx} style={styles.historyItem}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => setSearch(item)}
                          >
                            <Ionicons name="time-outline" size={16} color="#999" style={{ marginRight: 10 }} />
                            <Text style={styles.historyText}>{item}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeFromHistory(item)} style={{ padding: 4 }}>
                            <Ionicons name="close" size={16} color="#ccc" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Trending Searches */}
                <View style={[styles.section, { borderBottomWidth: 0 }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
                    <Ionicons name="trending-up" size={16} color="#ee4d2d" />
                  </View>
                  <View style={styles.trendingGrid}>
                    {TRENDING_SEARCHES.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.trendingTag}
                        onPress={() => setSearch(item)}
                      >
                        <Text style={styles.trendingTagText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              /* Autocomplete Suggestions */
              <View style={styles.autocompleteList}>
                {/* Category Suggestions */}
                {categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((cat: any) => (
                  <TouchableOpacity
                    key={`cat-${cat._id}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedCategory(cat._id);
                      setSearch('');
                      setIsSearchFocused(false);
                    }}
                  >
                    <Text style={styles.suggestionLabel}>Tìm trong </Text>
                    <Text style={[styles.suggestionText, { color: '#ee4d2d', fontWeight: '700' }]}>{cat.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))}

                {/* Generic Term Suggestions (Matching recent or just repeating search) */}
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map((p: any) => (
                  <TouchableOpacity
                    key={`prod-${p._id}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearch(p.name);
                      addToHistory(p.name);
                    }}
                  >
                    <Ionicons name="search-outline" size={16} color="#999" style={{ marginRight: 12 }} />
                    <Text style={styles.suggestionText} numberOfLines={1}>{p.name}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    addToHistory(search);
                    setIsSearchFocused(false);
                  }}
                >
                  <Ionicons name="search-outline" size={16} color="#999" style={{ marginRight: 12 }} />
                  <Text style={styles.suggestionText}>Tìm kiếm cho "{search}"</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── FILTER / SORT BAR ── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, showFilterModal && styles.filterChipActive]}
          onPress={() => {
            setTempCategory(selectedCategory);
            setTempPriceMin(priceMin);
            setTempPriceMax(priceMax);
            setShowFilterModal(true);
          }}
        >
          <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? '#111' : '#666'} />
          <Text style={[styles.filterChipText, activeFilterCount > 0 && { color: '#111', fontWeight: '700' }]}>
            Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterChip} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical-outline" size={16} color="#666" />
          <Text style={styles.filterChipText}>
            {SORT_OPTIONS.find(s => s.value === sort)?.label || 'Sắp xếp'}
          </Text>
        </TouchableOpacity>

        {/* Quick Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 10 }}>
          {categories.slice(0, 6).map((cat: any) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.categoryPill, selectedCategory === cat._id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat._id ? null : cat._id)}
            >
              <Text style={[styles.categoryPillText, selectedCategory === cat._id && styles.categoryPillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── PRODUCT GRID ── */}
      {loading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color="#ddd" />
          <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
          <Text style={styles.emptySub}>Thử tìm với từ khoá hoặc bộ lọc khác</Text>
          {(search || selectedCategory || priceMin || priceMax) && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearch(''); resetFilter(); }}>
              <Text style={styles.resetBtnText}>Xoá bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, i) => item._id || i.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#111" style={{ paddingVertical: 20 }} />
            ) : !hasMore && products.length > 0 ? (
              <Text style={styles.endText}>Đã hiển thị tất cả sản phẩm</Text>
            ) : null
          }
        />
      )}

      {/* ── SORT MODAL ── */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sắp xếp theo</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.sortOption}
                onPress={() => { setSort(opt.value); setShowSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, sort === opt.value && styles.sortOptionActive]}>
                  {opt.label}
                </Text>
                {sort === opt.value && <Ionicons name="checkmark" size={20} color="#111" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── FILTER MODAL ── */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Bộ lọc sản phẩm</Text>

            {/* Category Filter */}
            <Text style={styles.filterLabel}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.categoryPill, !tempCategory && styles.categoryPillActive]}
                  onPress={() => setTempCategory(null)}
                >
                  <Text style={[styles.categoryPillText, !tempCategory && styles.categoryPillTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                {categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.categoryPill, tempCategory === cat._id && styles.categoryPillActive]}
                    onPress={() => setTempCategory(tempCategory === cat._id ? null : cat._id)}
                  >
                    <Text style={[styles.categoryPillText, tempCategory === cat._id && styles.categoryPillTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Price Range */}
            <Text style={styles.filterLabel}>Khoảng giá (₫)</Text>
            <View style={styles.priceRangeRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Từ"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={tempPriceMin}
                onChangeText={setTempPriceMin}
              />
              <View style={styles.priceDash} />
              <TextInput
                style={styles.priceInput}
                placeholder="Đến"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={tempPriceMax}
                onChangeText={setTempPriceMax}
              />
            </View>

            {/* Quick Service Filters (Mock) */}
            <Text style={styles.filterLabel}>Dịch vụ & Khuyến mãi</Text>
            <View style={styles.quickFilterActions}>
              {['Freeship Xtra', 'Hoàn xu Xtra', '4 sao trở lên', 'Đang giảm giá'].map(tag => (
                <TouchableOpacity key={tag} style={styles.quickFilterTag}>
                  <Text style={styles.quickFilterTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterResetBtn} onPress={resetFilter}>
                <Text style={styles.filterResetText}>Thiết lập lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilter}>
                <Text style={styles.filterApplyText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Search
  searchRow: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  // Filter Bar
  filterBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee',
  },
  filterChipActive: { borderColor: '#111', backgroundColor: '#f0f0f0' },
  filterChipText: { fontSize: 12, color: '#666', fontWeight: '500' },

  categoryPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee',
  },
  categoryPillActive: { backgroundColor: '#111', borderColor: '#111' },
  categoryPillText: { fontSize: 12, color: '#666', fontWeight: '500' },
  categoryPillTextActive: { color: '#fff' },

  // Grid
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 14, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },
  resetBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#111' },
  resetBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  listContent: { padding: 10, paddingBottom: 30 },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },

  card: {
    width: CARD_WIDTH, marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden',
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: CARD_WIDTH * 1.25, backgroundColor: '#f5f5f5' },
  discountBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: '#111',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardInfo: { padding: 10 },
  brand: { fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: 3, letterSpacing: 0.5 },
  name: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 6, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontWeight: '800', color: '#111' },
  originalPrice: { fontSize: 12, color: '#aaa', textDecorationLine: 'line-through' },
  soldText: { fontSize: 11, color: '#999', marginTop: 4 },

  endText: { textAlign: 'center', color: '#ccc', fontSize: 13, paddingVertical: 20 },

  // Search Suggestions Overlay
  suggestionsOverlay: {
    position: 'absolute', top: 60, left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', zIndex: 100, paddingBottom: 20
  },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  clearText: { fontSize: 13, color: '#888' },
  historyList: { gap: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyText: { fontSize: 14, color: '#555' },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingTag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee'
  },
  trendingTagText: { fontSize: 13, color: '#333' },

  autocompleteList: { paddingVertical: 8 },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f9f9f9'
  },
  suggestionLabel: { fontSize: 14, color: '#888' },
  suggestionText: { fontSize: 14, color: '#222', flex: 1 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 36, maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 18, textAlign: 'center' },

  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  sortOptionText: { fontSize: 15, color: '#555', fontWeight: '500' },
  sortOptionActive: { color: '#111', fontWeight: '700' },

  filterLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  priceRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  priceInput: {
    flex: 1, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333',
  },
  priceDash: { width: 16, height: 2, backgroundColor: '#ccc' },

  filterActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  filterResetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  filterResetText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterApplyBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#ee4d2d', alignItems: 'center' },
  filterApplyText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  quickFilterActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  quickFilterTag: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#f8f8f8', borderWidth: 0.5, borderColor: '#eee'
  },
  quickFilterTagText: { fontSize: 12, color: '#444' },
});
