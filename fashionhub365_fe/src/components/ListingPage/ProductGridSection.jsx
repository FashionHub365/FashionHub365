import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterSidebar } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";
import { ListingHeader } from "./ListingHeader";
import listingApi from "../../apis/listingApi";
import Skeleton from "../common/Skeleton";

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
    limit: 12,
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
      limit: 12,
    });
    // setSearchInput(searchParams.get("search") || ""); // This line was removed in the provided diff, but the instruction only mentioned changing limit. I will keep it as it was not explicitly removed.
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
      setError("Failed to load products. Please try again.");
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

  // Pagination logic
  const totalPages = Math.ceil(total / filters.limit);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (filters.page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (filters.page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', filters.page - 1, filters.page, filters.page + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-12 mb-8 w-full">
        <button
          onClick={() => handlePageChange(filters.page - 1)}
          disabled={filters.page === 1}
          className="px-4 py-2 border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {pages.map((p, idx) => (
          p === '...' ? (
            <span key={`dots-${idx}`} className="w-8 flex justify-center text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-9 h-9 flex items-center justify-center border text-sm font-medium transition-colors ${filters.page === p ? 'bg-black text-white border-black' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            >
              {p}
            </button>
          )
        ))}

        <button
          onClick={() => handlePageChange(filters.page + 1)}
          disabled={filters.page === totalPages}
          className="px-4 py-2 border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <section className="flex flex-col md:flex-row items-start gap-8 px-4 md:px-8 lg:px-20 py-[30px] w-full max-w-[1440px] mx-auto">
      <div className="w-full md:w-1/4 lg:w-1/5 shrink-0 sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <FilterSidebar onFilterChange={handleFilterChange} activeFilters={filters} />
      </div>
      <main className="flex flex-col items-start relative flex-1 min-w-0 w-full">
        <ListingHeader total={total} activeCategory={filters.category} />

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
                placeholder="Search products..."
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
              Search
            </button>
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 border border-solid border-gray-200 bg-white px-3 py-2 flex-shrink-0">
            <span className="font-text-200 text-gray-400">Sort by:</span>
            <select
              id="listing-sort"
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-transparent outline-none font-text-200 text-x-600"
            >
              <option value="newest">Newest</option>
              <option value="best_sellers">Best Sellers</option>
              <option value="top_rated">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
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
                ? `No products found for "${filters.search}".`
                : "No matching products found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  activeColor={filters.color}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </main>
    </section>
  );
};
