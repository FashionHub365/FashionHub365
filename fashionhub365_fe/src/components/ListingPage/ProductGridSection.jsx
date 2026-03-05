import React, { useState, useEffect, useCallback, useRef } from "react";
import { FilterSidebar } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";
import { ListingHeader } from "./ListingHeader";
import listingApi from "../../apis/listingApi";
import Skeleton from "../common/Skeleton";

export const ProductGridSection = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Giá trị search input (hiển thị ngay trên UI)
  const [searchInput, setSearchInput] = useState("");

  // Filter state - được chia sẻ xuống FilterSidebar
  const [filters, setFilters] = useState({
    category: "",
    color: "",
    size: "",
    search: "",
    sort: "newest",
    page: 1,
    limit: 9,
  });

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
        <ListingHeader total={total} />

        {/* Thanh Search + Sort */}
        <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto] pb-4">
          {/* Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center flex-1 relative"
          >
            <div className="flex items-center flex-1 border border-solid border-gray-200 bg-white px-3 py-2 gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>

              <input
                id="listing-search"
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 bg-transparent outline-none font-text-200 text-x-600 text-[length:var(--text-200-font-size)] placeholder:text-x-300"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-gray-300 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white font-text-200 whitespace-nowrap hover:bg-gray-800 transition-colors"
            >
              Tìm
            </button>
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 border border-solid border-gray-200 bg-white px-3 py-2 flex-shrink-0">
            <span className="font-text-200 text-gray-400">Sắp xếp:</span>
            <select
              id="listing-sort"
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-transparent outline-none font-text-200 text-x-600"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
            </select>
          </div>
        </div>

        {/* Loading state - Skeletons */}
        {loading ? (
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex flex-col md:flex-row items-start gap-5 self-stretch w-full">
                {[1, 2, 3].map((col) => (
                  <div key={col} className="flex-1 grow space-y-4">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full py-20">
            <p className="font-text-200 text-red-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center w-full py-20">
            <p className="font-text-200 text-gray-400 italic">
              {filters.search
                ? `Không tìm thấy sản phẩm nào cho "${filters.search}".`
                : "Không tìm thấy sản phẩm phù hợp."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full">
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
