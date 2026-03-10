import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, CaretLeft, CaretRight } from "../Icons";
import axiosClient from "../../apis/axiosClient";
import wishlistApi from "../../apis/wishlistApi";
import storeApi from "../../apis/store.api";
import { useAuth } from "../../contexts/AuthContext";
import Skeleton from "../common/Skeleton";
import { useCart } from "../../contexts/CartContext";

export const ProductDetailsSection = ({ product, loading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── STATE ─────────────────────────────────────────────────────────
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { addToCart, loading: cartLoading } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isFollowingShop, setIsFollowingShop] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

  // ── FETCH FOLLOW STATUS ───────────────────────────────────────────
  useEffect(() => {
    const fetchFollowStatus = async () => {
      const storeId = product?.store_id?._id || product?.store_id;
      if (!user || !storeId) return;
      try {
        const res = await storeApi.getFollowingStatus(storeId);
        if (res.success) setIsFollowingShop(res.data.isFollowing);
      } catch (err) {
        console.error("Error fetching follow status:", err);
      }
    };
    fetchFollowStatus();
  }, [user, product?.store_id]);

  const handleFollowShopToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const storeId = product?.store_id?._id || product?.store_id;
    if (!storeId || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowingShop) {
        const res = await storeApi.unfollowStore(storeId);
        if (res.success) setIsFollowingShop(false);
      } else {
        const res = await storeApi.followStore(storeId);
        if (res.success) setIsFollowingShop(true);
      }
    } catch (err) {
      console.error("Error toggling follow shop:", err);
    } finally {
      setFollowLoading(false);
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

  // ── AUTOPLAY IMAGES ───────────────────────────────────────────────
  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [productImages.length]);

  // ── VARIANT & STOCK ──────────────────────────────────────
  const selectedColor = colorVariants[selectedColorIndex]?.name;
  const matchedVariant = product?.variants?.find(
    (v) =>
      v.attributes?.color === selectedColor &&
      (selectedSize ? v.attributes?.size === selectedSize : true)
  ) || product?.variants?.[0];

  // Stock của variant hiện tại
  const currentStock = matchedVariant?.stock ?? null;
  const isOutOfStock = currentStock !== null && currentStock === 0;

  // Reset quantity về 1 mỗi khi đổi size hoặc màu
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColorIndex]);

  const originalPrice = product?.base_price || 238;
  const salePrice = matchedVariant?.price || originalPrice;
  const productName = product?.name || "The ReWool® Oversized Shirt Jacket";
  const description = product?.description || "Meet your new chilly weather staple...";
  const categoryName = product?.primary_category_id?.name || "Men / Outerwear";

  // ── STATS & BADGES ────────────────────────────────────────────────
  const store = typeof product?.store_id === "object" ? product.store_id : null;
  const storeName = store?.name;
  const storeSlug = store?.slug || store?._id;
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
    if (isOutOfStock) {
      setCartMessage({ type: "error", text: "Sản phẩm đã hết hàng." });
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
    const result = await addToCart(product._id, variant._id, quantity);
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
        <div className="flex flex-col items-start gap-4 relative flex-1 grow w-full max-w-[600px] lg:max-w-none">
          <Skeleton className="w-full aspect-[3/4] flex-1 grow" />
          <div className="flex gap-2 w-full justify-center">
            <Skeleton className="w-20 h-28" />
            <Skeleton className="w-20 h-28" />
            <Skeleton className="w-20 h-28" />
            <Skeleton className="w-20 h-28" />
          </div>
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
    <section className="items-start gap-10 px-20 py-[30px] flex md:flex-row flex-col relative self-stretch w-full flex-[0_0_auto] justify-center">
      <div className="flex flex-col items-center gap-4 relative w-full max-w-[550px]">
        {/* Main Image */}
        <div className="w-full relative aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            className="w-full h-full object-cover transition-opacity duration-500"
            alt={productImages[currentImageIndex]?.alt || "Product image"}
            src={productImages[currentImageIndex]?.src}
          />
          {salePrice < originalPrice && (
            <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 absolute top-3 left-3 bg-red-600 text-white text-sm font-bold shadow-sm z-10">
              {Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% off
            </div>
          )}
        </div>

        {/* Thumbnail Carousels */}
        {productImages.length > 1 && (
          <div className="w-full relative flex items-center gap-2 px-10 mt-2 pb-2">
            <button
              className="absolute left-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10"
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1)}
              aria-label="Previous image"
            >
              <CaretLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex gap-2 w-full overflow-x-auto snap-x scroll-smooth [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {productImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`shrink-0 w-20 h-28 md:w-24 md:h-32 relative snap-center transition-all ${currentImageIndex === idx ? 'border-2 border-red-600' : 'border border-gray-200 hover:border-gray-400'}`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  {currentImageIndex !== idx && <div className="absolute inset-0 bg-white/40 transition-colors hover:bg-transparent" />}
                </button>
              ))}
            </div>

            <button
              className="absolute right-0 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10"
              onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
              aria-label="Next image"
            >
              <CaretRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <aside className="flex flex-col w-[450px] shrink-0 items-start gap-px relative">
        <header className="flex flex-col items-start gap-3 pb-5 border-b border-x-100 w-full">

          {/* Breadcrumbs & Store */}
          <nav aria-label="Breadcrumb" className="flex flex-col items-start gap-1 w-full">
            {storeName && (
              <Link
                to={`/stores/${storeSlug}`}
                className="group flex flex-col items-start gap-1 pt-1 pb-2 w-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 border border-gray-300">
                    {store?.avatar ? (
                      <img src={store.avatar} alt={storeName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{storeName.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-[14px] font-bold text-gray-800 uppercase tracking-wider group-hover:text-blue-600 group-hover:underline transition-colors">
                    {storeName}
                  </span>
                </div>
              </Link>
            )}
            <p className="font-text-100 text-x-400 text-[13px] tracking-wide mt-1">
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
                <span className="bg-white text-emerald-600 border border-emerald-400 text-[10px] font-semibold px-2 py-1 uppercase tracking-widest leading-none shadow-sm">
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

          {/* Thông tin Cửa hàng (Seller) */}
          {product?.store_id && (
            <div className="flex flex-col gap-3 mt-3 w-full">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg w-full border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/10 flex items-center justify-center text-[#ee4d2d] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.371 2.371 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976l2.61-3.044zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.458-.725L12.394 1.5H3.606L1.242 4.9a1.375 1.375 0 0 0 2.458.725.5.5 0 0 1 1 0zM5 8a.5.5 0 0 1 .5.5V11h5V8.5a.5.5 0 0 1 1 0V12a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V8.5A.5.5 0 0 1 5 8zm1.5 2h3v1h-3v-1z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Người bán</p>
                  <Link
                    to={`/store/${product.store_id._id || product.store_id}`}
                    className="text-sm font-bold text-gray-900 hover:text-[#ee4d2d] transition-colors uppercase truncate block"
                  >
                    {product.store_id.owner_user_id?.profile?.full_name || product.store_id.name || "Gian hàng đối tác"}
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleFollowShopToggle}
                    disabled={followLoading}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-sm transition-all uppercase border
                      ${isFollowingShop
                        ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                        : "text-[#ee4d2d] border-[#ee4d2d] hover:bg-[#ee4d2d]/5"}`}
                  >
                    {isFollowingShop ? "Đang Theo Dõi" : "+ Theo Dõi"}
                  </button>
                  <Link
                    to={`/store/${product.store_id._id || product.store_id}`}
                    className="text-[11px] font-bold text-gray-600 border border-gray-300 px-3 py-1.5 rounded-sm hover:bg-gray-50 transition-all uppercase"
                  >
                    Xem Shop
                  </Link>
                </div>
              </div>
            </div>
          )}


          <p className="text-sm text-gray-600 pt-2">{description}</p>
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
            {sizeVariants.map(s => {
              // Kiểm tra stock của từng size
              const sizeVariant = product?.variants?.find(
                v => v.attributes?.color === selectedColor && v.attributes?.size === s
              );
              const sizeStock = sizeVariant?.stock ?? null;
              const isSizeOutOfStock = sizeStock !== null && sizeStock === 0;
              return (
                <button
                  key={s}
                  onClick={() => !isSizeOutOfStock && setSelectedSize(s)}
                  disabled={isSizeOutOfStock}
                  title={isSizeOutOfStock ? 'Hết hàng' : ''}
                  className={`w-12 h-12 flex items-center justify-center border font-text-200 relative
                    ${selectedSize === s ? "bg-black text-white border-black" : ""}
                    ${isSizeOutOfStock
                      ? "border-x-100 text-x-300 cursor-not-allowed bg-gray-50 line-through"
                      : selectedSize !== s ? "bg-white border-x-200 hover:border-black" : ""
                    }`}
                >
                  {s}
                  {isSizeOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="absolute w-full h-px bg-x-300 rotate-45 transform" />
                    </span>
                  )}
                </button>
              );
            })}
          </fieldset>

          {/* Stock indicator */}
          {selectedSize && currentStock !== null && (
            <div className="flex items-center gap-2 mt-1">
              {isOutOfStock ? (
                <span className="text-red-600 text-sm font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hết hàng
                </span>
              ) : currentStock <= 5 ? (
                <span className="text-orange-500 text-sm font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Chỉ còn {currentStock} sản phẩm!
                </span>
              ) : (
                <span className="text-green-600 text-sm flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Còn hàng ({currentStock} sản phẩm)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chọn số lượng - luôn hiện khi đã chọn size */}
        {selectedSize && !isOutOfStock && (
          <div className="flex items-center gap-4 py-3 px-0 self-stretch w-full border-t border-x-100">
            <span className="font-text-200 text-x-500">Số lượng</span>
            <div className="flex items-center border border-x-200">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center text-x-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light"
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={currentStock ?? 99}
                value={quantity}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) {
                    setQuantity(Math.min(v, currentStock ?? 99));
                  } else if (e.target.value === '') {
                    setQuantity('');
                  }
                }}
                onBlur={e => {
                  const v = parseInt(e.target.value, 10);
                  setQuantity(isNaN(v) || v < 1 ? 1 : Math.min(v, currentStock ?? 99));
                }}
                onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                className="w-10 h-9 text-center font-text-200 font-semibold text-x-600 border-x border-x-200 bg-transparent focus:outline-none focus:bg-gray-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Quantity"
              />
              <button
                onClick={() => setQuantity(q => Math.min(currentStock ?? 99, q + 1))}
                disabled={currentStock !== null && quantity >= currentStock}
                className="w-9 h-9 flex items-center justify-center text-x-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
            {currentStock !== null && (
              <span className="text-xs text-x-300">(tối đa {currentStock})</span>
            )}
          </div>
        )}

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
              disabled={cartLoading || isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2.5 px-0 py-3 transition-colors
                ${isOutOfStock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-x-500 cursor-pointer hover:bg-black"
                } disabled:opacity-60`}
              aria-label={isOutOfStock ? "Hết hàng" : "Add to bag"}
            >
              <span className="font-text-300 text-white text-center tracking-[var(--text-300-letter-spacing)]">
                {cartLoading ? "ĐANG THÊM..." : isOutOfStock ? "HẾ́T HÀNG" : "ADD TO BAG"}
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
