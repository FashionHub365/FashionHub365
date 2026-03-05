import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterSidebar } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";
import { ListingHeader } from "./ListingHeader";
import listingApi from "../../apis/listingApi";

export const ProductGridSection = () => {
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Giá trị search input (hiển thị ngay trên UI)
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || ""
  );

  // Filter state — đọc URL query params ngay từ initial state
  const [filters, setFilters] = useState(() => ({
    category: searchParams.get("category") || "",
    color: searchParams.get("color") || "",
    size: searchParams.get("size") || "",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "newest",
    page: 1,
    limit: 9,
  }));

  /**
   * Sync filters từ URL mỗi khi searchParams thay đổi
   * (ví dụ: navigate từ Landing → /listing?category=shirts)
   */
  useEffect(() => {
    setFilters({
      category: searchParams.get("category") || "",
      color: searchParams.get("color") || "",
      size: searchParams.get("size") || "",
      search: searchParams.get("search") || "",
      sort: searchParams.get("sort") || "newest",
      page: 1,
      limit: 9,
    });
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce timer ref
  const debounceTimer = useRef(null);

  /**
   * Fetch sản phẩm từ API mỗi khi filter thay đổi
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Loại bỏ các filter rỗng trước khi gọi API
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== null)
      );
      const response = await listingApi.getProducts(cleanParams);
      if (response.success) {
        setProducts(response.data.products);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error("Error fetching listing products:", err);
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Handler khi FilterSidebar thay đổi filter
   * Reset về page 1 mỗi khi filter mới được áp dụng
   */
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  /**
   * Handler khi người dùng gõ vào ô search
   * Debounce 500ms để không gọi API liên tục
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear timer cũ
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Set timer mới
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 500);
  };

  /**
   * Submit search khi nhấn Enter hoặc nút tìm kiếm
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  /**
   * Xóa search
   */
  const handleClearSearch = () => {
    setSearchInput("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setFilters((prev) => ({ ...prev, search: "", page: 1 }));
  };

  /**
   * Handler sort
   */
  const handleSortChange = (e) => {
    setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }));
  };

  /**
   * Chia products thành các hàng 3 sản phẩm
   */
  const rows = [];
  for (let i = 0; i < products.length; i += 3) {
    rows.push(products.slice(i, i + 3));
  }

  return (
    <section className="flex items-start gap-4 px-4 md:px-20 py-[30px] relative self-stretch w-full flex-[0_0_auto]">
      <FilterSidebar onFilterChange={handleFilterChange} activeFilters={filters} />
      <main className="flex flex-col items-start relative flex-1 grow">
        <ListingHeader total={total} activeCategory={filters.category} />

        {/* Thanh Search + Sort */}
        <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto] pb-4">
          {/* Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center flex-1 relative"
          >
            <div className="flex items-center flex-1 border border-solid border-x-200 bg-white px-3 py-2 gap-2">
              {/* Icon kính lúp */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-x-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>

              <input
                id="listing-search"
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 bg-transparent outline-none font-text-200 text-x-600 text-[length:var(--text-200-font-size)] placeholder:text-x-300"
                aria-label="Tìm kiếm sản phẩm"
              />

              {/* Nút xóa (hiện khi có text) */}
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-x-300 hover:text-x-600 flex-shrink-0 transition-colors duration-150"
                  aria-label="Xóa tìm kiếm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Nút tìm kiếm */}
            <button
              type="submit"
              className="flex items-center justify-center px-4 py-2 bg-x-600 text-white font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] whitespace-nowrap h-full cursor-pointer hover:opacity-90 transition-opacity duration-150"
              aria-label="Tìm kiếm"
            >
              Tìm
            </button>
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 border border-solid border-x-200 bg-white px-3 py-2 flex-shrink-0">
            <span className="font-text-200 text-x-400 text-[length:var(--text-200-font-size)] whitespace-nowrap">
              Sắp xếp:
            </span>
            <select
              id="listing-sort"
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-transparent outline-none font-text-200 text-x-600 text-[length:var(--text-200-font-size)] cursor-pointer"
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="newest">Mới nhất</option>
              <option value="best_sellers">Bán chạy nhất</option>
              <option value="top_rated">Đánh giá cao nhất</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
            </select>
          </div>
        </div>

        {/* Hiển thị từ khoá đang tìm */}
        {filters.search && (
          <div className="flex items-center gap-2 pb-3 self-stretch">
            <span className="font-text-200 text-x-400 text-[length:var(--text-200-font-size)]">
              Kết quả tìm kiếm cho:
            </span>
            <span className="font-text-200-demi text-x-600 text-[length:var(--text-200-font-size)] italic">
              &ldquo;{filters.search}&rdquo;
            </span>
            <button
              onClick={handleClearSearch}
              className="font-text-200 text-x-300 text-[length:var(--text-200-font-size)] underline cursor-pointer hover:text-x-600 transition-colors duration-150"
            >
              Xóa
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center w-full py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-x-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-text-200 text-x-400">Đang tải sản phẩm...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-center justify-center w-full py-20">
            <p className="font-text-200 text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="flex items-center justify-center w-full py-20">
            <p className="font-text-200 text-x-400">
              {filters.search
                ? `Không tìm thấy sản phẩm nào cho "${filters.search}".`
                : "Không tìm thấy sản phẩm phù hợp."}
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && products.length > 0 && (
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex flex-col md:flex-row items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
              >
                {row.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    activeColor={filters.color}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </section>
  );
};
