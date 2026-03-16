import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { HeaderSection } from "../components/HeaderSection";
import { FooterSection } from "../components/FooterSection";
import { FilterSidebar } from "../components/ListingPage/FilterSidebar";
import { StoreProductCard } from "../components/StorePage/StoreProductCard";
import { StoreHeader } from "../components/StorePage/StoreHeader";
import listingApi from "../apis/listingApi";
import storeApi from "../apis/store.api";

const isObjectId = (value = "") => /^[a-fA-F0-9]{24}$/.test(String(value));

export const StoreProfile = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: "",
    color: "",
    size: "",
    search: "",
    sort: "newest",
    page: 1,
    limit: 12, // More products per page for store view
  });

  const [categories, setCategories] = useState([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const moreMenuRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const debounceTimer = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await listingApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchStoreInfo = useCallback(async () => {
    // ── MOCK DATA CHO DỰ ÁN ───────────────────────────────────────────
    const mockStoreData = {
      _id: storeId,
      name: "Hoang Fashion Store",
      avatar: "https://images.unsplash.com/photo-1544441517-4acbceac6afa?auto=format&fit=crop&w=100&q=80",
      description: "Chuyên cung cấp quần áo thời trang thiết kế cao cấp, cập nhật xu hướng mới nhất với chất lượng tuyệt vời.",
      level: { value: "premium" },
      rating_summary: { avgStars: 4.8, totalRatings: 15420 },
      created_at: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(), // 2 years ago
      followers: 78500,
      response_rate: 96,
      products_count: 324,
    };

    try {
      const response = await storeApi.getStoreDetail(storeId);
      if (response.success && response.data) {
        const storeResponse = response.data?.store || response.data;
        // Merge real data with mock data so it always looks complete
        setStore({ ...mockStoreData, ...storeResponse });
      } else {
        setStore(mockStoreData);
      }
    } catch (err) {
      console.error("Error fetching store info:", err);
      // Fallback to mock data on error so UI still shows up
      setStore(mockStoreData);
    }
  }, [storeId]);

  const fetchProducts = useCallback(async () => {
    const resolvedStoreId = store?._id || (isObjectId(storeId) ? storeId : "");
    if (!resolvedStoreId) {
      setProducts([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== null)
      );

      const response = await listingApi.getProducts({
        ...cleanParams,
        storeId: resolvedStoreId,
      });

      if (response.success && response.data?.products?.length > 0) {
        setProducts(response.data.products);
        setTotal(response.data.total);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Error fetching store products:", err);
      // Fallback on catch
      setError("Không thể tải sản phẩm của gian hàng.");
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, store?._id, storeId]);

  useEffect(() => {
    fetchStoreInfo();
    fetchCategories();
  }, [fetchStoreInfo, fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle click outside "More" menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleCategoryClick = (categorySlug) => {
    setFilters((prev) => ({ ...prev, category: categorySlug, page: 1 }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 500);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setFilters((prev) => ({
      ...prev,
      category: "",
      color: "",
      size: "",
      search: "",
      page: 1,
    }));
  };

  const handleSortChange = (e) => {
    setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }));
  };

  const visibleCategories = categories.slice(0, 5);
  const moreCategories = categories.slice(5);
  const activeCategoryName =
    categories.find((cat) => cat.slug === filters.category)?.name || filters.category;

  return (
    <div className="flex flex-col items-center relative bg-[#f5f5f5] min-h-screen">
      <StoreHeader store={store} totalProducts={total} />

      {/* Shopee Style Navigation Bar with Real Categories */}
      <nav className="w-full bg-white shadow-sm sticky top-0 z-20 overflow-visible border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center">
            <button
              onClick={() => handleCategoryClick("")}
              className={`px-8 py-4 text-sm font-medium uppercase tracking-tight transition-all border-b-2 ${filters.category === ""
                ? "border-[#ee4d2d] text-[#ee4d2d]"
                : "border-transparent text-gray-800 hover:text-[#ee4d2d]"
                }`}
            >
              Dạo
            </button>
            <button
              onClick={() => handleCategoryClick("")}
              className={`px-8 py-4 text-sm font-medium uppercase tracking-tight transition-all border-b-2 ${filters.category === ""
                  ? "text-[#ee4d2d]"
                  : "text-gray-800 hover:text-[#ee4d2d]"
                }`}
            >
              TẤT CẢ SẢN PHẨM
            </button>

            {visibleCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-8 py-4 text-sm font-medium uppercase tracking-tight transition-all border-b-2 ${filters.category === cat.slug
                    ? "border-[#ee4d2d] text-[#ee4d2d]"
                    : "border-transparent text-gray-800 hover:text-[#ee4d2d]"
                  }`}
              >
                {cat.name}
              </button>
            ))}

            {moreCategories.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreCategories(!showMoreCategories)}
                  className={`px-8 py-4 text-sm font-medium text-gray-800 hover:text-[#ee4d2d] transition-colors whitespace-nowrap uppercase tracking-tight flex items-center gap-1 border-b-2 ${moreCategories.some(cat => cat.slug === filters.category)
                    ? "border-[#ee4d2d] text-[#ee4d2d]"
                    : "border-transparent"
                    }`}
                >
                  Thêm <svg className={`w-3 h-3 transition-transform ${showMoreCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showMoreCategories && (
                  <div className="absolute top-full right-0 w-56 bg-white shadow-xl border border-gray-100 mt-0.5 rounded-b-sm py-2 z-30">
                    {moreCategories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          handleCategoryClick(cat.slug);
                          setShowMoreCategories(false);
                        }}
                        className={`w-full text-left px-6 py-3 text-xs font-medium uppercase tracking-wide transition-colors hover:bg-gray-50 hover:text-[#ee4d2d] ${filters.category === cat.slug ? "text-[#ee4d2d] bg-gray-50" : "text-gray-700"
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <h3 className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">
            {filters.category
              ? `Danh mục: ${categories.find(c => c.slug === filters.category)?.name || filters.category}`
              : "GỢI Ý CHO BẠN"}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-medium">Sắp xếp theo:</span>
            <select
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-white border border-gray-200 text-xs px-3 py-1.5 outline-none rounded-sm shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp tới Cao</option>
              <option value="price_desc">Giá: Cao xuống Thấp</option>
            </select>
          </div>
        </div>

        <main className="w-full">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white p-2 rounded-sm shadow-sm animate-pulse">
                  <div className="bg-gray-100 aspect-square rounded-sm mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded-sm w-full mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded-sm w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-red-500 text-center w-full bg-white rounded-sm shadow-sm border border-red-50">{error}</div>
          ) : products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-sm shadow-sm border border-dashed border-gray-200">
              <div className="text-5xl mb-4 grayscale opacity-30 italic">🛍️</div>
              <p className="text-gray-400 text-sm font-medium">Chưa có sản phẩm nào phù hợp trong danh mục này.</p>
              <button onClick={handleClearSearch} className="mt-4 text-[#ee4d2d] text-xs font-bold hover:underline">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {products.map((product) => (
                <div key={product._id} className="bg-white hover:border-[#ee4d2d] border border-transparent transition-all hover:shadow-lg rounded-sm overflow-hidden h-full">
                  <StoreProductCard product={product} activeColor={filters.color} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
