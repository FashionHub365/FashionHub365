import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import cartApi from "../../apis/cartApi";

// ── Star rating mini ──────────────────────────────────────────────────
const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} className={`w-2.5 h-2.5 ${i <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
        fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// ── Single recommendation card ────────────────────────────────────────
const RecommendCard = ({ product, onAdd, adding, meta }) => {
  const navigate = useNavigate();
  const priceLabel = product.price?.toLocaleString("vi-VN") + "₫";

  return (
    <div className={`flex items-start gap-3 p-2.5 border transition-all
            ${product.helpsReachFreeShip
        ? "border-green-300 bg-green-50/50"
        : "border-x-200"}`}>

      {/* Free-ship nudge badge */}
      {product.helpsReachFreeShip && (
        <div className="absolute -top-1 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight">
          🚀 Free ship!
        </div>
      )}

      {/* Product image */}
      <button
        onClick={() => navigate(`/product/${product._id}`)}
        className="w-[70px] h-[100px] flex-shrink-0 overflow-hidden bg-gray-100"
      >
        <img
          src={product.image || "/textures/cartpage/image.jpg"}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = "/textures/cartpage/image.jpg"; }}
        />
      </button>

      {/* Info */}
      <div className="flex flex-col items-start justify-between flex-1 self-stretch min-w-0">
        <div className="w-full">
          <p className="text-sm font-semibold text-x-600 leading-snug line-clamp-2">
            {product.name}
          </p>
          {product.variantName && (
            <p className="text-xs text-x-300 mt-0.5 truncate">{product.variantName}</p>
          )}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Stars rating={product.rating} />
              <span className="text-[10px] text-gray-400">({product.soldCount})</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between w-full mt-2">
          <span className="text-sm font-bold text-x-500">{priceLabel}</span>
          <button
            onClick={() => onAdd(product)}
            disabled={adding}
            className={`px-4 py-2 text-xs font-bold text-white transition-all
                            ${adding
                ? "bg-gray-400 cursor-not-allowed"
                : product.helpsReachFreeShip
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-x-500 hover:opacity-90"}`}
          >
            {adding ? "..." : "ADD"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export const CartRecommendations = () => {
  const { cartData, addToCart } = useCart();
  const { items = [], totalAmount = 0 } = cartData;

  const [recs, setRecs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [addingId, setAddingId] = useState(null);

  // Build params từ giỏ hàng hiện tại
  const fetchRecs = useCallback(async () => {
    if (items.length === 0) { setRecs([]); return; }
    setLoading(true);
    try {
      const cartProductIds = items.map(i => i.productId?.toString()).filter(Boolean);
      const storeIds = [...new Set(items.map(i => i.storeId?.toString()).filter(Boolean))];
      const categoryIds = [...new Set(items.flatMap(i => i.categoryIds || []))];

      const res = await cartApi.getCartRecommendations({
        cartProductIds,
        storeIds,
        categoryIds,
        cartTotal: totalAmount,
        limit: 4,
      });

      if (res.success) {
        setRecs(res.data.products || []);
        setMeta(res.data.meta || null);
        setActiveIdx(0);
      }
    } catch {
      // Fail silently – recommendations là tính năng phụ
    } finally {
      setLoading(false);
    }
  }, [items, totalAmount]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const handleAdd = async (product) => {
    if (!product.variantId) return;
    setAddingId(product._id.toString());
    try {
      await addToCart(product._id, product.variantId, 1);
      // Refresh gợi ý sau khi thêm
      setTimeout(fetchRecs, 500);
    } catch {
      // ignore
    } finally {
      setAddingId(null);
    }
  };

  // ── Không render nếu giỏ trống hoặc đang tải ban đầu ─────────────
  if (items.length === 0 || (loading && recs.length === 0)) return null;
  if (recs.length === 0) return null;

  const FREE_SHIP = meta?.freeShipThreshold || 1_000_000;
  const gap = meta?.gap || 0;
  const showNudge = meta?.showFreeShipNudge && gap > 0;
  const currentProduct = recs[activeIdx];

  return (
    <section className="flex flex-col items-start gap-3 self-stretch w-full">
      {/* Title + free-ship nudge */}
      <div className="w-full">
        <h2 className="font-text-300-demi text-x-600 text-sm font-bold">
          Before You Go
        </h2>
        {showNudge && (
          <div className="mt-1.5 flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-sm">
            <span className="text-green-600 text-base">🚚</span>
            <div>
              <p className="text-xs font-bold text-green-800 leading-tight">
                Thêm {gap.toLocaleString("vi-VN")}₫ để miễn phí ship!
              </p>
              <div className="mt-1 w-full bg-green-200 rounded-full h-1.5" style={{ width: "100%" }}>
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalAmount / FREE_SHIP) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product card */}
      {loading ? (
        <div className="w-full h-28 bg-gray-50 border border-x-200 flex items-center justify-center">
          <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : currentProduct && (
        <div className="relative w-full">
          <RecommendCard
            product={currentProduct}
            meta={meta}
            onAdd={handleAdd}
            adding={addingId === currentProduct._id?.toString()}
          />
        </div>
      )}

      {/* Dots navigation */}
      {recs.length > 1 && (
        <nav className="flex items-center gap-2" aria-label="Recommendation navigation">
          {recs.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`Product ${i + 1}`}
              aria-current={i === activeIdx ? "true" : "false"}
              className={`w-[7px] h-[7px] rounded-full transition-all
                                ${i === activeIdx ? "bg-x-500 w-4" : "bg-x-200 hover:opacity-60"}`}
            />
          ))}
          <span className="ml-auto text-[10px] text-gray-400">
            {activeIdx + 1}/{recs.length}
          </span>
        </nav>
      )}
    </section>
  );
};
