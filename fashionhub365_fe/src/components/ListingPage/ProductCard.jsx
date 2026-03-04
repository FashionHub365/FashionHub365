import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "../Icons";
import wishlistApi from "../../apis/wishlistApi";
import { useAuth } from "../../contexts/AuthContext";

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
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
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

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
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

  return (
    <article className="flex flex-col items-start gap-2.5 relative flex-1 grow">
      <Link to={`/product/${product._id}`} className="block relative self-stretch w-full">
        <img
          className="relative self-stretch w-full h-[392px] object-cover"
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
        <button
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full bg-white shadow-md transition-all hover:scale-110 ${isInWishlist ? 'text-red-500' : 'text-gray-400'}`}
          aria-label="Toggle wishlist"
        >
          <Heart className="!relative !w-5 !h-5" filled={isInWishlist} />
        </button>
      </Link>

      <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex items-start gap-3 px-0 py-2 relative self-stretch w-full flex-[0_0_auto]">
          <h3 className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
            {product.name}
          </h3>
          <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
            {salePrice < originalPrice && (
              <span className="font-text-200-strikethrough text-x-300 line-through relative w-fit mt-[-1.00px] font-[number:var(--text-200-strikethrough-font-weight)] text-[length:var(--text-200-strikethrough-font-size)] text-right tracking-[var(--text-200-strikethrough-letter-spacing)] leading-[var(--text-200-strikethrough-line-height)] whitespace-nowrap [font-style:var(--text-200-strikethrough-font-style)]">
                {originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
            <span className="font-text-200-demi text-x-500 relative w-fit mt-[-1.00px] font-[number:var(--text-200-demi-font-weight)] text-[length:var(--text-200-demi-font-size)] text-right tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
              {salePrice.toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>

        {/* Màu đang chọn */}
        <span className="relative self-stretch h-4 font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
          {colorVariants[selectedColorIndex]?.name || ""}
        </span>
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
              style={{ backgroundColor: color.hex }}
              onClick={() => setSelectedColorIndex(index)}
              aria-label={`Select color ${color.name}`}
            />
          ))}
        </div>
      )}

      {/* Badges từ tag_ids (nếu có) */}
      {product.tag_ids && product.tag_ids.length > 0 && (
        <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          {product.tag_ids.slice(0, 2).map((tag, index) => (
            <div
              key={index}
              className={`${index === 0 ? "ml-[-1.00px]" : ""
                } inline-flex items-center justify-center gap-2.5 px-2 py-1.5 relative flex-[0_0_auto] mt-[-1.00px] mb-[-1.00px] border border-solid border-x-200`}
            >
              <span className="relative w-fit font-text-100 font-[number:var(--text-100-font-weight)] text-x-300 text-[length:var(--text-100-font-size)] text-center tracking-[var(--text-100-letter-spacing)] leading-[var(--text-100-line-height)] whitespace-nowrap [font-style:var(--text-100-font-style)]">
                {typeof tag === "object" ? tag.name : tag}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

/**
 * Helper: Map tên màu tiếng Anh sang mã HEX
 * Dùng cho việc hiển thị color swatch từ dữ liệu variants.attributes.color
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
};

function getColorHex(colorName) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}