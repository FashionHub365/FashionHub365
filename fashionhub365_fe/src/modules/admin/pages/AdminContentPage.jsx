import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminOverviewService } from "../services/adminOverviewService";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const AdminContentPage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productMeta, setProductMeta] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        adminOverviewService.getCategories({
          search: search.trim() || undefined,
          includeDeleted,
        }),
        adminOverviewService.getPublicProducts({
          page,
          limit: 10,
          search: search.trim() || undefined,
          sort,
        }),
      ]);

      const nextCategories = Array.isArray(categoriesRes) ? categoriesRes : [];
      const nextProducts = Array.isArray(productsRes?.products) ? productsRes.products : [];

      setCategories(nextCategories);
      setProducts(nextProducts);
      setProductMeta({
        page: Number(productsRes?.page || page),
        totalPages: Number(productsRes?.totalPages || 1),
        total: Number(productsRes?.total || 0),
        limit: Number(productsRes?.limit || 10),
      });
    } catch (nextError) {
      setError(nextError.message || "Unable to load content data.");
      setCategories([]);
      setProducts([]);
      setProductMeta({ page: 1, totalPages: 1, total: 0, limit: 10 });
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page, search, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const contentStats = useMemo(() => {
    const totalCategories = categories.length;
    const deletedCategories = categories.filter((item) => item?.deleted_at).length;
    return {
      totalCategories,
      deletedCategories,
      productTotal: Number(productMeta.total || 0),
    };
  }, [categories, productMeta.total]);

  return (
    <section className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Content hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Combined view of categories and product content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/categories"
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage categories
            </Link>
            <Link
              to="/admin/products"
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage products
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form
          className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,180px,160px,120px] gap-2.5"
          onSubmit={onSubmitSearch}
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search category or product..."
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
            <option value="best_sellers">Best sellers</option>
            <option value="most_viewed">Most viewed</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => {
                setPage(1);
                setIncludeDeleted(event.target.checked);
              }}
              className="w-4 h-4"
            />
            Include deleted
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total categories</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(contentStats.totalCategories || 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Deleted categories</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(contentStats.deletedCategories || 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total products</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(contentStats.productTotal || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Categories snapshot</h2>
        <p className="text-sm text-slate-500 mt-1">Current category list.</p>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-left">Slug</th>
                <th className="px-3 py-2.5 text-left">Parent</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    Loading data...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.slice(0, 12).map((category) => {
                  const isDeleted = Boolean(category?.deleted_at);
                  return (
                    <tr key={category._id} className="border-t border-slate-100 text-left">
                      <td className="px-3 py-2.5 text-slate-900 font-medium">{category.name || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">{category.slug || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {category?.parent_id?.name || "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isDeleted
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {isDeleted ? "DELETED" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {formatDateTime(category.updated_at || category.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Products snapshot</h2>
        <p className="text-sm text-slate-500 mt-1">Products list for current filters.</p>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">Product</th>
                <th className="px-3 py-2.5 text-left">Category</th>
                <th className="px-3 py-2.5 text-left">Store</th>
                <th className="px-3 py-2.5 text-right">Price</th>
                <th className="px-3 py-2.5 text-right">Sold</th>
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
                    <td className="px-3 py-2.5 text-slate-900 font-medium line-clamp-1">
                      {product.name || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {product?.primary_category_id?.name ||
                        product?.primary_category_id?.slug ||
                        "-"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {product?.store_id?.name || product?.store_id?.slug || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-800 font-semibold">
                      {formatMoney(product.base_price)} VND
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {Number(product.sold_count || 0).toLocaleString("en-US")}
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
            Page {productMeta.page}/{Math.max(productMeta.totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((prev) =>
                Math.min(prev + 1, Math.max(productMeta.totalPages, 1))
              )
            }
            disabled={page >= Math.max(productMeta.totalPages, 1)}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminContentPage;
