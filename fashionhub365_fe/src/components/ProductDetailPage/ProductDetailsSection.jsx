import React, { useState, useEffect } from "react";
import { Heart } from "../Icons";
import wishlistApi from "../../apis/wishlistApi";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Skeleton from "../common/Skeleton";
import { useCart } from "../../contexts/CartContext";

/**
 * ProductDetailsSection
 * Nhận prop `product` từ ProductDetail page (dữ liệu từ API)
 * Nếu product === null → hiển thị UI tĩnh như thiết kế gốc (fallback cho /product-detail)
 */
export const ProductDetailsSection = ({ product, loading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── STATE ─────────────────────────────────────────────────────────
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { addToCart, loading: cartLoading } = useCart();

  // ── FETCH WISHLIST STATUS ─────────────────────────────────────────────
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
        console.error("Error checking wishlist:", err);
      }
    };
    checkWishlist();
  }, [user, product?._id]);

  const handleToggleWishlist = async () => {
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
        setCartMessage({ type: "success", text: "Đã xóa khỏi danh sách yêu thích." });
      } else {
        await wishlistApi.addToWishlist(product._id);
        setIsInWishlist(true);
        setCartMessage({ type: "success", text: "Đã thêm vào danh sách yêu thích! ❤️" });
      }
    } catch (err) {
      setCartMessage({ type: "error", text: "Lỗi khi cập nhật danh sách yêu thích." });
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  // ── STATIC FALLBACK DATA ──────────────────────────────────────────
  const staticImages = [
    { id: 1, src: "/textures/productdetailpage/image.jpg", alt: "Product image 1" },
    { id: 2, src: "/textures/productdetailpage/image2.jpg", alt: "Product image 2" },
    { id: 3, src: "/textures/productdetailpage/image3.jpg", alt: "Product image 3" },
    { id: 4, src: "/textures/productdetailpage/image4.jpg", alt: "Product image 4" },
    { id: 5, src: "/textures/productdetailpage/image5.jpg", alt: "Product image 5" },
    { id: 6, src: "/textures/productdetailpage/image6.jpg", alt: "Product image 6" },
  ];

  const staticColors = [
    { id: 1, name: "Navy Blue", color: "#103080" },
    { id: 2, name: "Brown", color: "#7c3c0e" },
  ];

  const staticSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // ── DỮ LIỆU TỪ API ────────────────────────────────────────────────
  const productImages = product?.media?.length
    ? [...product.media]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((m, i) => ({ id: i + 1, src: m.url, alt: `${product.name} - ${i + 1}` }))
    : staticImages;

  const colorVariants = product?.variants
    ? [
      ...new Map(
        product.variants
          .filter((v) => v.attributes?.color)
          .map((v) => [v.attributes.color, { name: v.attributes.color, color: getColorHex(v.attributes.color) }])
      ).values(),
    ]
    : staticColors.map((c) => ({ name: c.name, color: c.color }));

  const sizeVariants = product?.variants
    ? [...new Set(product.variants.filter((v) => v.attributes?.size).map((v) => v.attributes.size))]
    : staticSizes;

  const features = [
    { id: 1, icon: "/textures/productdetailpage/ship.jpg", title: "Free Shipping", description: "On all orders over 1.000.000₫" },
    { id: 2, icon: "/textures/productdetailpage/return.jpg", title: "Easy Returns", description: "Extended returns within 30 days" },
    { id: 3, icon: "/textures/productdetailpage/gift.jpg", title: "Send It As A Gift", description: "Add a free personalized note during checkout" },
  ];

  const selectedColor = colorVariants[selectedColorIndex]?.name;
  const matchedVariant = product?.variants?.find(
    (v) =>
      v.attributes?.color === selectedColor &&
      (selectedSize ? v.attributes?.size === selectedSize : true)
  ) || product?.variants?.[0];

  const originalPrice = product?.base_price || 238;
  const salePrice = matchedVariant?.price || originalPrice;
  const productName = product?.name || "The ReWool® Oversized Shirt Jacket";
  const description = product?.description || "Meet your new chilly weather staple...";
  const categoryName = product?.primary_category_id?.name || "Men / Outerwear";

  // ── STATS & BADGES ────────────────────────────────────────────────
  const storeName = typeof product?.store_id === "object" ? product.store_id?.name : null;
  const rating = product?.rating || { average: 0, count: 0 };
  const soldCount = product?.sold_count || 0;

  // ── ADD TO BAG (via CartContext) ──────────────────────────────────
  const handleAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      setCartMessage({ type: "error", text: "Vui lòng chọn kích thước trước." });
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    const variant = product.variants?.find(
      (v) => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize
    );
    if (!variant) {
      setCartMessage({ type: "error", text: "Không tìm thấy biến thể sản phẩm này." });
      return;
    }

    // Dùng CartContext – tự động mở sidebar khi thành công
    const result = await addToCart(product._id, variant._id, 1);
    if (!result.success) {
      setCartMessage({ type: "error", text: result.message });
      setTimeout(() => setCartMessage(null), 3000);
    }
    // Không cần message success vì sidebar đã mở
  };

  // ── RENDER LOADING SKELETON ───────────────────────────────────────
  if (loading) {
    return (
      <section className="items-start gap-6 px-20 py-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-2 relative flex-1 grow">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <Skeleton className="h-[508px] flex-1 grow" />
              <Skeleton className="h-[508px] flex-1 grow" />
            </div>
          ))}
        </div>
        <aside className="flex flex-col w-96 items-start gap-6 relative">
          <div className="w-full space-y-4 pb-4 border-b border-gray-200">
            <Skeleton className="h-4 w-1/3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-8 w-1/4" />
            </div>
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-12 h-12" />)}
            </div>
          </div>
          <Skeleton className="h-14 w-full" />
          <div className="w-full space-y-4 pt-6 border-t border-gray-200">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    );
  }

  // ── RENDER ACTUAL CONTENT ─────────────────────────────────────────
  return (
    <section className="items-start gap-6 px-20 py-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
        {[0, 2, 4].map((startIndex) => (
          <div key={startIndex} className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
            {productImages.slice(startIndex, startIndex + 2).map((img, index) => (
              <div key={img.id} className="flex h-[508px] items-start gap-2.5 relative flex-1 grow">
                <img className="flex-1 grow relative self-stretch object-cover" alt={img.alt} src={img.src} />
                {startIndex === 0 && index === 0 && salePrice < originalPrice && (
                  <div className="inline-flex items-center justify-center gap-2.5 px-1.5 py-1 absolute top-2 left-2 bg-white text-red font-bold">
                    {Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% off
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <aside className="flex flex-col w-96 items-start gap-px relative">
        <header className="flex flex-col items-start gap-3 pb-5 border-b border-x-100 w-full">

          {/* Breadcrumbs & Store */}
          <nav aria-label="Breadcrumb" className="flex flex-col items-start gap-1 w-full">
            {storeName && (
              <span className="text-[11px] font-bold text-x-400 uppercase tracking-widest mt-1">
                {storeName}
              </span>
            )}
            <p className="font-text-100 text-x-300 text-[13px] tracking-wide mt-0.5">
              {categoryName}
            </p>
          </nav>

          {/* Title */}
          <h1 className="font-display-100 text-[26px] text-x-600 tracking-wide leading-snug">
            {productName}
          </h1>

          {/* Badges Động */}
          {(product?.isBestSeller || product?.isTrending || product?.isNewArrival) && (
            <div className="flex flex-wrap items-center gap-2 mt-1 -mb-1">
              {product?.isBestSeller && (
                <span className="bg-black text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-widest leading-none">
                  Best Seller
                </span>
              )}
              {product?.isTrending && (
                <span className="bg-white text-black border border-x-200 text-[10px] font-semibold px-2 py-1 uppercase tracking-widest leading-none shadow-sm">
                  Trending
                </span>
              )}
              {product?.isNewArrival && (
                <span className="bg-white text-black border border-x-200 text-[10px] font-semibold px-2 py-1 uppercase tracking-widest leading-none shadow-sm">
                  New Arrival
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3 mt-1 w-full">
            <span className="font-display-200 text-[22px] text-x-600 tracking-wide font-medium leading-none">
              {salePrice.toLocaleString("vi-VN")}₫
            </span>
            {salePrice < originalPrice && (
              <span className="font-text-200 text-x-300 line-through text-[15px] mb-0.5">
                {originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          {/* Rating & Sold count */}
          <div className="flex items-center gap-3 mt-1 pt-1 border-t border-x-100 w-full">
            <div className="flex items-center gap-1.5" role="img" aria-label={`${rating.average} out of 5 stars`}>
              <StarRating value={rating.average} />
              <div className="flex items-center ml-1">
                <span className="text-[13.5px] font-medium text-x-600 mr-1.5">{rating.average.toFixed(1)}</span>
                <span className="text-[13px] text-x-400 decoration-x-200 underline-offset-2 hover:underline cursor-pointer transition-colors">
                  ({rating.count} reviews)
                </span>
              </div>
            </div>

            {soldCount > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l border-x-200 h-4">
                <span className="text-[13px] text-x-500">
                  <span className="font-semibold text-x-600">{soldCount.toLocaleString()}</span> sold
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Chọn màu */}
        <div className="flex flex-col items-start gap-2.5 px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <span className="font-text-200">
              Color: {colorVariants[selectedColorIndex]?.name}
            </span>
          </div>

          <fieldset className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <legend className="sr-only">Select color</legend>
            {colorVariants.map((colorOption, index) => (
              <button
                key={colorOption.name}
                onClick={() => setSelectedColorIndex(index)}
                className={`w-8 h-8 rounded-full border-2 ${selectedColorIndex === index ? "border-black" : "border-transparent"}`}
                style={{ backgroundColor: colorOption.color }}
                aria-label={colorOption.name}
              />
            ))}
          </fieldset>
        </div>

        {/* Chọn size */}
        <div className="flex flex-col items-start gap-2.5 px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
            <span className="font-text-200">Size</span>
            <span className="font-text-200 underline cursor-pointer">Size Guide</span>
          </div>
          <fieldset className="flex items-start gap-2 flex-wrap relative self-stretch w-full flex-[0_0_auto]">
            <legend className="sr-only">Select size</legend>
            {sizeVariants.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`w-12 h-12 flex items-center justify-center border font-text-200 ${selectedSize === s ? "bg-black text-white border-black" : "bg-white border-x-200 hover:border-black"}`}
              >
                {s}
              </button>
            ))}
          </fieldset>
        </div>

        {/* Nút ADD TO BAG + Wishlist */}
        <div className="flex flex-col items-center justify-center gap-2.5 px-0 py-8 relative self-stretch w-full flex-[0_0_auto]">
          {cartMessage && (
            <p className={`text-center font-text-200 ${cartMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {cartMessage.text}
            </p>
          )}
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="flex-1 flex items-center justify-center gap-2.5 px-0 py-3 bg-x-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-black transition-colors"
              aria-label="Add to bag"
            >
              <span className="font-text-300 text-white text-center tracking-[var(--text-300-letter-spacing)]">
                {cartLoading ? "ĐANG THÊM..." : "ADD TO BAG"}
              </span>
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="p-3 border border-x-200 hover:border-black transition-colors"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart filled={isInWishlist} className={isInWishlist ? "text-red-500 w-5 h-5" : "w-5 h-5"} />
            </button>
          </div>
        </div>

        {/* Features: Free Shipping / Easy Returns / Gift */}
        <div className="flex flex-col items-start gap-6 px-0 py-6 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
          {features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
              <img src={feature.icon} alt={feature.title} className="relative w-[34px] h-[34px] object-contain" />
              <div className="flex flex-col items-start relative flex-1 grow">
                <span className="font-text-200 font-bold">{feature.title}</span>
                <span className="font-text-200">{feature.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mô tả sản phẩm */}
        <article className="flex-col gap-4 pt-10 pb-3 px-0 ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200 flex items-start relative self-stretch w-full flex-[0_0_auto]">
          <span className="font-text-200 font-bold">{product?.short_description || "Part shirt, part jacket, all style."}</span>
          <p className="font-text-200 text-left">{description}</p>
        </article>

        {/* Model / Fit / Sustainability */}
        <div className="flex items-center text-left px-0 py-5 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
          <span className="font-text-200 font-bold w-20">Model</span>
          <span className="font-text-200">Model is 6'2" wearing a size M</span>
        </div>

        <div className="flex items-start text-left px-0 py-5 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
          <span className="font-text-200 font-bold w-20">Fit</span>
          <span className="font-text-200">Questions about fit? Contact Us</span>
        </div>

        <div className="flex flex-col items-start px-0 py-5 relative self-stretch w-full flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
          <span className="font-text-200 font-bold">Sustainability</span>
          <img src="/textures/productdetailpage/Sustainability.jpg" alt="Sustainability" className="mt-2 w-full object-contain" />
        </div>
      </aside>
    </section>
  );
};

// ── Star Rating Component ────────────────────────────────────────────────
function StarRating({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.3 && value - full < 0.8;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="flex items-center gap-0.5 text-amber-400" aria-hidden="true">
      {Array(full).fill(0).map((_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg key="h" className="w-3.5 h-3.5" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-grad-detail">
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#half-grad-detail)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array(empty).fill(0).map((_, i) => (
        <svg key={`e${i}`} className="w-3.5 h-3.5 fill-gray-200" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Helper: map tên màu → hex ────────────────────────────────────────
const COLOR_MAP = {
  black: "#1a1a1a", white: "#ffffff", blue: "#21558d", brown: "#925c37",
  green: "#585b45", grey: "#e1e1e3", gray: "#e1e1e3", orange: "#d38632",
  pink: "#efcec9", red: "#bd2830", tan: "#b3a695", navy: "#1b2a4a",
  beige: "#f5e6c8", yellow: "#f5c842", purple: "#6b2fa0",
};

function getColorHex(colorName) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}
