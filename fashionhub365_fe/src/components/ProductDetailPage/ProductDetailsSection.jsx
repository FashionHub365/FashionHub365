import React, { useState, useEffect } from "react";
import { Star, Heart } from "../Icons";
import axiosClient from "../../apis/axiosClient";
import wishlistApi from "../../apis/wishlistApi";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Skeleton from "../common/Skeleton";

/**
 * ProductDetailsSection
 * Nhận prop `product` từ ProductDetail page (dữ liệu từ API)
 * Nếu product === null → hiển thị UI tĩnh như thiết kế gốc (fallback cho /product-detail)
 */
export const ProductDetailsSection = ({ product, loading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── STATE (Hooks must be called first and in the same order) ───────
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── FETCH WISHLIST STATUS ─────────────────────────────────────────
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
    setAddingToCart(true);
    try {
      await axiosClient.post("/cart/items", {
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
      });
      setCartMessage({ type: "success", text: "Đã thêm vào giỏ hàng! 🎉" });
    } catch (err) {
      setCartMessage({ type: "error", text: "Lỗi khi thêm vào giỏ hàng." });
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
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
        <header className="flex flex-col items-start gap-1 pt-0 pb-4 px-0 relative self-stretch w-full border-b border-gray-200">
          <p className="text-gray-500">{categoryName}</p>
          <div className="flex items-start gap-2.5 w-full justify-between">
            <h1 className="text-2xl font-bold flex-1">{productName}</h1>
            <div className="flex items-end flex-col">
              {salePrice < originalPrice && (
                <span className="text-gray-400 line-through">{originalPrice.toLocaleString()}₫</span>
              )}
              <span className="text-xl font-bold">{salePrice.toLocaleString()}₫</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3" />)}
            </div>
            <span className="text-sm text-gray-500">5.0 (2 reviews)</span>
          </div>
          <p className="text-sm text-gray-600 pt-2">{description}</p>
        </header>

        <div className="w-full py-4 space-y-3">
          <p className="font-bold">Color: {selectedColor}</p>
          <div className="flex gap-3">
            {colorVariants.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setSelectedColorIndex(i)}
                className={`w-8 h-8 rounded-full border-2 ${selectedColorIndex === i ? "border-black" : "border-transparent"}`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>

        <div className="w-full py-4 space-y-3">
          <div className="flex justify-between underline cursor-pointer">
            <p className="font-bold">Size</p>
            <p>Size Guide</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {sizeVariants.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`w-12 h-12 flex items-center justify-center border ${selectedSize === s ? "bg-black text-white" : "bg-gray-100"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full py-8 space-y-4">
          {cartMessage && (
            <p className={`text-center ${cartMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {cartMessage.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 bg-black text-white py-4 font-bold disabled:bg-gray-400"
            >
              {addingToCart ? "ADDING..." : "ADD TO BAG"}
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="p-4 border disabled:opacity-50"
            >
              <Heart filled={isInWishlist} className={isInWishlist ? "text-red-500" : ""} />
            </button>
          </div>
        </div>

        <div className="w-full py-6 border-t space-y-6">
          {features.map(f => (
            <div key={f.id} className="flex items-center gap-4">
              <img src={f.icon} alt="" className="w-8 h-8" />
              <div>
                <p className="font-bold">{f.title}</p>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
};

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
