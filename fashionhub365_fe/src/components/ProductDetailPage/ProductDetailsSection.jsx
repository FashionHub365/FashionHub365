import React, { useState } from "react";
import { Star } from "../Icons";
import axiosClient from "../../apis/axiosClient";

/**
 * ProductDetailsSection
 * Nhận prop `product` từ ProductDetail page (dữ liệu từ API)
 * Nếu product === null → hiển thị UI tĩnh như thiết kế gốc (fallback cho /product-detail)
 * 
 * Chức năng:
 *  - Hiển thị gallery ảnh từ product.media
 *  - Chọn màu sắc từ variants
 *  - Chọn kích thước từ variants
 *  - Nút "ADD TO BAG" gọi Cart API (POST /cart/items)
 */
export const ProductDetailsSection = ({ product }) => {
  // ── STATIC FALLBACK DATA (khi không có product từ API) ────────────
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

  // ── DỮ LIỆU TỪ API (khi có product) ─────────────────────────────
  // Gallery ảnh: lấy từ product.media, sort theo sortOrder
  const productImages = product?.media?.length
    ? product.media
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((m, i) => ({ id: i + 1, src: m.url, alt: `${product.name} - ${i + 1}` }))
    : staticImages;

  // Màu sắc: extract từ variants.attributes.color (lấy unique color)
  const colorVariants = product?.variants
    ? [
      ...new Map(
        product.variants
          .filter((v) => v.attributes?.color)
          .map((v) => [v.attributes.color, { name: v.attributes.color, color: getColorHex(v.attributes.color) }])
      ).values(),
    ]
    : staticColors.map((c) => ({ name: c.name, color: c.color }));

  // Kích thước: extract từ variants.attributes.size (lấy unique size)
  const sizeVariants = product?.variants
    ? [...new Set(product.variants.filter((v) => v.attributes?.size).map((v) => v.attributes.size))]
    : staticSizes;

  // Features section (tĩnh - thiết kế của nhóm)
  const features = [
    { id: 1, icon: "/textures/productdetailpage/ship.jpg", title: "Free Shipping", description: "On all orders over 1.000.000₫" },
    { id: 2, icon: "/textures/productdetailpage/return.jpg", title: "Easy Returns", description: "Extended returns within 30 days" },
    { id: 3, icon: "/textures/productdetailpage/gift.jpg", title: "Send It As A Gift", description: "Add a free personalized note during checkout" },
  ];

  // ── STATE ─────────────────────────────────────────────────────────
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

  // ── THÔNG TIN GIÁ ─────────────────────────────────────────────────
  // Tìm variant tương ứng với màu + size đang chọn
  const selectedColor = colorVariants[selectedColorIndex]?.name;
  const matchedVariant = product?.variants?.find(
    (v) =>
      v.attributes?.color === selectedColor &&
      (selectedSize ? v.attributes?.size === selectedSize : true)
  ) || product?.variants?.[0];

  const originalPrice = product?.base_price || 238;
  const salePrice = matchedVariant?.price || originalPrice;
  const productName = product?.name || "The ReWool® Oversized Shirt Jacket";
  const description = product?.description || "Meet your new chilly weather staple. The ReWool® Oversized Shirt Jacket has all the classic shirt detailing...";
  const categoryName = product?.primary_category_id?.name || "Men / Outerwear - Jackets & Coats";

  // ── ADD TO BAG ────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      setCartMessage({ type: "error", text: "Vui lòng chọn kích thước trước." });
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    // Tìm variantId tương ứng với màu + size đã chọn
    const variant = product.variants?.find(
      (v) => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize
    );
    if (!variant) {
      setCartMessage({ type: "error", text: "Không tìm thấy biến thể sản phẩm này." });
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    setAddingToCart(true);
    setCartMessage(null);
    try {
      await axiosClient.post("/cart/items", {
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
      });
      setCartMessage({ type: "success", text: "Đã thêm vào giỏ hàng! 🎉" });
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi thêm vào giỏ hàng.";
      // Nếu 401 → chưa đăng nhập
      if (err.response?.status === 401) {
        setCartMessage({ type: "error", text: "Vui lòng đăng nhập để thêm vào giỏ hàng." });
      } else {
        setCartMessage({ type: "error", text: msg });
      }
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <section className="items-start gap-6 px-20 py-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
      {/* Gallery ảnh: giữ nguyên layout 2 cột × 3 hàng của nhóm */}
      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
        {[0, 2, 4].map((startIndex) => (
          <div
            key={startIndex}
            className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]"
          >
            {productImages.slice(startIndex, startIndex + 2).map((img, index) => (
              <div
                key={img.id}
                className="flex h-[508px] items-start gap-2.5 relative flex-1 grow"
              >
                <img
                  className="flex-1 grow relative self-stretch object-cover"
                  alt={img.alt}
                  src={img.src}
                />
                {startIndex === 0 && index === 0 && salePrice < originalPrice && (
                  <div className="inline-flex items-center justify-center gap-2.5 px-1.5 py-1 absolute top-2 left-2 bg-white">
                    <div className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-red text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                      {Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% off
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sidebar thông tin sản phẩm */}
      <aside className="flex flex-col w-96 items-start gap-px relative">
        {/* Header: tên, giá, rating */}
        <header className="flex flex-col items-start gap-1 pt-0 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-100">
          <nav aria-label="Breadcrumb">
            <p className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              {categoryName}
            </p>
          </nav>

          <div className="flex items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <h1 className="relative text-left flex-1 mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
              {productName}
            </h1>

            <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
              {salePrice < originalPrice && (
                <span className="w-fit font-display-100-strikethrough text-x-300 text-[length:var(--display-100-strikethrough-font-size)] tracking-[var(--display-100-strikethrough-letter-spacing)] leading-[var(--display-100-strikethrough-line-height)] line-through whitespace-nowrap relative mt-[-1.00px] font-[number:var(--display-100-strikethrough-font-weight)] [font-style:var(--display-100-strikethrough-font-style)]">
                  {originalPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
              <span className="w-fit font-display-100 text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] whitespace-nowrap relative mt-[-1.00px] font-[number:var(--display-100-font-weight)] [font-style:var(--display-100-font-style)]">
                {salePrice.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]" role="img" aria-label="5 out of 5 stars">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className="!relative !w-3 !h-3" />
              ))}
            </div>
            <span className="text-sm text-x-500">5.0 (2 reviews)</span>
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
                type="button"
                onClick={() => setSelectedColorIndex(index)}
                className={`relative w-8 h-8 rounded-2xl border border-solid ${selectedColorIndex === index ? "border-x-600" : "border-x-200"
                  }`}
                aria-label={`Select ${colorOption.name} color`}
                aria-pressed={selectedColorIndex === index}
              >
                <div
                  className="h-full rounded-2xl"
                  style={{ backgroundColor: colorOption.color, border: "2px solid white" }}
                />
              </button>
            ))}
          </fieldset>
        </div>

        {/* Chọn size */}
        <div className="flex flex-col items-start gap-2.5 px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
            <span className="font-text-200">Size</span>
            <span className="font-text-200 underline cursor-pointer">Size Guide</span>
          </div>

          <fieldset className="flex items-start gap-3 flex-wrap relative self-stretch w-full flex-[0_0_auto]">
            <legend className="sr-only">Select size</legend>
            {sizeVariants.map((sizeOption) => (
              <button
                key={sizeOption}
                type="button"
                onClick={() => setSelectedSize(sizeOption)}
                className={`flex w-[45px] items-center justify-center gap-2.5 p-3 relative ${selectedSize === sizeOption ? "bg-x-500" : "bg-x-100"
                  }`}
                aria-label={`Select size ${sizeOption}`}
                aria-pressed={selectedSize === sizeOption}
              >
                <span
                  className={`relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)] ${selectedSize === sizeOption ? "text-white" : "text-x-500"
                    }`}
                >
                  {sizeOption}
                </span>
              </button>
            ))}
          </fieldset>
        </div>

        {/* Nút ADD TO BAG */}
        <div className="flex flex-col items-center justify-center gap-2.5 px-0 py-8 relative self-stretch w-full flex-[0_0_auto]">
          {cartMessage && (
            <p className={`text-sm font-text-200 ${cartMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {cartMessage.text}
            </p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="all-[unset] box-border flex items-center justify-center gap-2.5 px-0 py-3 relative self-stretch w-full flex-[0_0_auto] bg-x-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Add to bag"
          >
            <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-white text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
              {addingToCart ? "ĐANG THÊM..." : "ADD TO BAG"}
            </span>
          </button>
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

        {/* Model / Fit / Sustainability (tĩnh – giữ nguyên thiết kế nhóm) */}
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
