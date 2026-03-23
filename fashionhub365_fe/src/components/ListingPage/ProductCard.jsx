import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "../Icons";
import wishlistApi from "../../apis/wishlistApi";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { isPrivilegedCommerceUser } from "../../utils/roleUtils";
import { showLoginRequired } from "../../utils/swalUtils";

/**
 * ProductCard - Hiển thị thông tin 1 sản phẩm
 * Map đúng field từ API backend:
 *   - product._id
 *   - product.name
 *   - product.base_price
 *   - product.media[].url, isPrimary
 *   - product.variants[].attributes.color / size / price
 */
export const ProductCard = ({ product, activeColor = "" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const isBlockedBuyer = isPrivilegedCommerceUser(user);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  // Sắp xếp media theo sortOrder để ứng đúng thứ tự màu
  const sortedMedia = product.media
    ? [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  // Ảnh primary (fallback)
  const primaryImage =
    sortedMedia.find((m) => m.isPrimary)?.url ||
    sortedMedia[0]?.url ||
    "/textures/listingpage/image.jpg";

  // Lấy danh sách màu duy nhất từ variants
  const colorVariants = product.variants
    ? product.variants
      .filter((v) => v.attributes?.color)
      .reduce((acc, v) => {
        const color = v.attributes.color;
        if (!acc.find((c) => c.name === color)) {
          acc.push({ name: color, hex: getColorHex(color) });
        }
        return acc;
      }, [])
    : [];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  /**
   * Khi FilterSidebar chọn 1 màu (activeColor):
   * → Tự động highlight swatch màu đó trên card
   * → Ảnh tự động chuyển sang ảnh ứng với màu đó
   * Khi xóa filter màu (activeColor = "") → reset về index 0
   */
  useEffect(() => {
    if (!activeColor) {
      setSelectedColorIndex(0);
      return;
    }
    // Tìm index của màu activeColor trong colorVariants (so sánh không phân biệt hoa/thường)
    const matchIndex = colorVariants.findIndex(
      (c) => c.name.toLowerCase() === activeColor.toLowerCase()
    );
    setSelectedColorIndex(matchIndex >= 0 ? matchIndex : 0);
  }, [activeColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !product?._id) return;
      try {
        const response = await wishlistApi.getWishlist();
        if (response.success && response.data) {
          const exists = response.data.items.some(item =>
            (item.productId._id || item.productId) === product._id
          );
          setIsInWishlist(exists);
        }
      } catch (err) {
        console.error("Error checking wishlist in ProductCard:", err);
      }
    };
    checkWishlist();
  }, [user, product?._id]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlockedBuyer) return;
    if (!user) {
      showLoginRequired(navigate, "thêm sản phẩm vào giỏ hàng");
      return;
    }
    if (isAdding) return;
    setIsAdding(true);

    const variant = product.variants?.find(v => v.attributes?.color?.toLowerCase() === colorVariants[selectedColorIndex]?.name?.toLowerCase()) || product.variants?.[0];

    if (!variant) {
      navigate(`/product/${product._id}`);
      return;
    }

    const result = await addToCart(product._id, variant._id, 1);
    setIsAdding(false);
    if (!result.success && result.message === "Unauthorized") {
      navigate('/login');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showLoginRequired(navigate, "vào danh sách yêu thích");
      return;
    }
    if (!product?._id) return;

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistApi.removeFromWishlist(product._id);
        setIsInWishlist(false);
      } else {
        await wishlistApi.addToWishlist(product._id);
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error("Error toggling wishlist in ProductCard:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  /**
   * Ảnh hiển thị thay đổi theo màu đang chọn:
   * - Nếu có media[selectedColorIndex] → dùng ảnh đó (mỗi ảnh ứng 1 màu)
   * - Nếu không đủ ảnh → fallback về primaryImage
   */
  const currentImage =
    sortedMedia[selectedColorIndex]?.url || primaryImage;

  // Tính giá: ưu tiên variant có giá thấp nhất
  const minVariantPrice =
    product.variants && product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price || product.base_price))
      : product.base_price;

  // Giá gốc (base_price) và giá bán (variant min price)
  const originalPrice = product.base_price;
  const salePrice = minVariantPrice;

  // Tính % giảm giá (nếu có)
  const discountPercent =
    salePrice < originalPrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : null;

  // ── Store & Stats ──────────────────────────────────────────────────
  const storeName =
    typeof product.store_id === "object"
      ? (product.store_id?.owner_user_id?.profile?.full_name || product.store_id?.name || "Partner Store")
      : null;

  const rating = product.rating || { average: 0, count: 0 };
  const soldCount = product.sold_count || 0;

  return (
    <article className="flex flex-col items-start gap-2.5 relative w-full h-full group">
      <Link to={`/product/${product._id}`} className="block relative self-stretch w-full aspect-[3/4] overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={product.name}
          src={currentImage}
        />
        {discountPercent && (
          <div className="inline-flex items-center justify-center gap-2.5 px-1.5 py-1 absolute top-2 left-2 bg-white">
            <span className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-red text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
              {discountPercent}% off
            </span>
          </div>
        )}
        {/* Badges tròn góc trái trên - giống style wishlist button */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isBestSeller && (
            <div
              className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center"
              title="Best Seller"
            >
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {product.isTrending && (
            <div
              className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center"
              title="Trending"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          )}
          {product.isNewArrival && (
            <div
              className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center"
              title="New Arrival"
            >
              <span className="text-[9px] font-extrabold text-emerald-500 tracking-widest leading-none">NEW</span>
            </div>
          )}
        </div>

        {/* Wishlist button - góc phải trên */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 z-10 ${isInWishlist ? 'text-red-500' : 'text-gray-400'}`}
          aria-label="Toggle wishlist"
        >
          <Heart className="!relative !w-5 !h-5" filled={isInWishlist} />
        </button>

        {/* Quick Add Button */}
        {!isBlockedBuyer && (
          <button
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-sm text-white font-bold text-[11px] uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 text-center hover:bg-black flex items-center justify-center gap-2 z-10"
          >
            {isAdding ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Add to Cart"}
          </button>
        )}
      </Link>

      <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full px-2 pb-2 mt-2">
        {storeName && (
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate w-full">
            {storeName}
          </span>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start w-full gap-1.5 sm:gap-2">
          <h3 className="flex-1 text-[13px] sm:text-[14px] font-semibold text-gray-800 leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="flex flex-row sm:flex-col items-end shrink-0 gap-2 sm:gap-0 mt-1 sm:mt-0">
            {salePrice < originalPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                {originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
            <span className="text-[14px] sm:text-[15px] font-bold text-gray-900 leading-none">
              {salePrice.toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>

        {/* Màu đang chọn */}
        <span className="text-[12px] font-medium text-gray-500 truncate w-full mt-[2px] h-4">
          {colorVariants[selectedColorIndex]?.name || ""}
        </span>

        {/* Rating & Sold count */}
        <div className="flex items-center gap-3 pt-1">
          {rating.count > 0 && (
            <div className="flex items-center gap-1">
              <StarRating value={rating.average} />
              <span className="text-[11px] text-x-400 font-medium">
                {rating.average.toFixed(1)}
              </span>
              <span className="text-[11px] text-x-300">
                ({rating.count})
              </span>
            </div>
          )}
          {soldCount > 0 && (
            <span className="text-[11px] text-x-300">
              <span className="text-x-500 font-semibold">{soldCount.toLocaleString()}</span> sold
            </span>
          )}
        </div>
      </div>

      {/* Color swatches */}
      {colorVariants.length > 0 && (
        <div className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          {colorVariants.map((color, index) => (
            <button
              key={index}
              className={`w-5 h-5 rounded-full focus:outline-none ${selectedColorIndex === index
                ? "ring-1 ring-offset-2 ring-x-600"
                : ""
                }`}
              style={{ background: color.hex }}
              onClick={() => setSelectedColorIndex(index)}
              aria-label={`Select color ${color.name}`}
            />
          ))}
        </div>
      )}

    </article>
  );
};

// ── Star Rating Component ────────────────────────────────────────────────
function StarRating({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.3 && value - full < 0.8;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="flex items-center gap-px text-amber-400" aria-hidden="true">
      {Array(full).fill(0).map((_, i) => (
        <svg key={`f${i}`} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg key="h" className="w-3 h-3" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path fill="url(#half-grad)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array(empty).fill(0).map((_, i) => (
        <svg key={`e${i}`} className="w-3 h-3 fill-gray-200" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Helper: Map tên màu tiếng Anh sang mã HEX
 */
const COLOR_MAP = {
  black: "#1a1a1a",
  white: "#ffffff",
  blue: "#21558d",
  brown: "#925c37",
  green: "#585b45",
  grey: "#e1e1e3",
  gray: "#e1e1e3",
  orange: "#d38632",
  pink: "#efcec9",
  red: "#bd2830",
  tan: "#b3a695",
  navy: "#1b2a4a",
  beige: "#f5e6c8",
  yellow: "#f5c842",
  purple: "#6b2fa0",
  "đen": "#1a1a1a",
  "trắng": "#ffffff",
  "xám": "#e1e1e3",
  "be": "#f5e6c8",
  "collegiate green": "#1b4f23",
  "black/white": "linear-gradient(135deg, #1a1a1a 50%, #ffffff 50%)",
  "white/green": "linear-gradient(135deg, #ffffff 50%, #585b45 50%)",
};

function getColorHex(colorName) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}
