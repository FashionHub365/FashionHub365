import React, { useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await adminOverviewService.getPublicProducts({
          page,
          limit: 12,
          search: search.trim() || undefined,
          sort,
        });
        setProducts(Array.isArray(result?.products) ? result.products : []);
        setMeta({
          page: Number(result?.page || page),
          totalPages: Number(result?.totalPages || 1),
          total: Number(result?.total || 0),
          limit: Number(result?.limit || 12),
        });
      } catch (nextError) {
        setError(nextError.message || "Unable to load product list.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page, search, sort]);

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const productsCountText = useMemo(
    () => Number(meta.total || 0).toLocaleString("en-US"),
    [meta.total]
  );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Product Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor products and key metrics.</p>
        </div>
        <div className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{productsCountText}</span> products
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,180px,120px] gap-2.5" onSubmit={onSubmitSearch}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by product name..."
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={sort}
          onChange={(event) => {
            setPage(1);
            setSort(event.target.value);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="best_sellers">Best sellers</option>
          <option value="most_viewed">Most viewed</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2.5 text-left">Product</th>
              <th className="px-3 py-2.5 text-left">Store</th>
              <th className="px-3 py-2.5 text-right">Price</th>
              <th className="px-3 py-2.5 text-right">Sold</th>
              <th className="px-3 py-2.5 text-right">Views</th>
              <th className="px-3 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>
                  Loading data...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5">
                    <p className="text-slate-900 font-medium line-clamp-1">{product.name || "-"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {product.primary_category_id?.name || product.primary_category_id?.slug || "-"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {product.store_id?.name || product.store_id?.slug || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-800 font-semibold">
                    {formatMoney(product.base_price)} VND
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {Number(product.sold_count || 0).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {Number(product.view_count || 0).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                      {String(product.status || "active").toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-slate-600">
          Page {meta.page}/{Math.max(meta.totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(meta.totalPages, 1)))}
          disabled={page >= Math.max(meta.totalPages, 1)}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default AdminProductsPage;
