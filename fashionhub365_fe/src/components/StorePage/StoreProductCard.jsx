import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * ProductCard - Hiển thị thông tin 1 sản phẩm
 * Map đúng field từ API backend:
 *   - product._id
 *   - product.name
 *   - product.base_price
 *   - product.media[].url, isPrimary
 *   - product.variants[].attributes.color / size / price
 */
export const StoreProductCard = ({ product, activeColor = "" }) => {
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
    <article className="flex flex-col bg-white h-full group/card transition-all hover:shadow-md border border-transparent hover:border-[#ee4d2d]/20">
      <Link to={`/product/${product._id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          alt={product.name}
          src={currentImage}
        />
        {discountPercent && (
          <div className="absolute top-0 right-0 bg-[#ffd839] text-[#ee4d2d] px-1.5 py-1 text-[10px] font-bold flex flex-col items-center leading-none">
            <span>{discountPercent}%</span>
            <span className="text-[8px] text-white uppercase mt-0.5">Giảm</span>
          </div>
        )}
      </Link>

      <div className="p-2 flex flex-col flex-1 justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs text-gray-800 line-clamp-2 leading-relaxed min-h-[32px]">
            {product.name}
          </h3>
          
          {/* Promotion Tags (Shopee style) */}
          <div className="flex flex-wrap gap-1 mb-1">
             <span className="text-[9px] border border-[#ee4d2d] text-[#ee4d2d] px-1 rounded-sm">7 ngày trả hàng</span>
          </div>

          <div className="flex items-baseline gap-1 mt-auto">
             <span className="text-xs text-[#ee4d2d]">₫</span>
             <span className="text-base font-medium text-[#ee4d2d] leading-none">
                {salePrice.toLocaleString("vi-VN")}
             </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
           <div className="flex items-center text-[10px] text-gray-500">
              <span className="text-[#ffce3d] mr-1">★</span>
              <span>4.9</span>
           </div>
           <span className="text-[10px] text-gray-500">Đã bán 1,2k</span>
        </div>
      </div>
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
