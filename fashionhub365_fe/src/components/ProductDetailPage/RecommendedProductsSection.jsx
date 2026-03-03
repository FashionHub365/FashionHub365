import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import listingApi from "../../apis/listingApi";

/**
 * RecommendedProductsSection
 * Nhận prop `productId` từ ProductDetail page
 * Fetch sản phẩm gợi ý cùng category từ API
 * Giữ nguyên layout/design gốc của nhóm
 */
export const RecommendedProductsSection = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const response = await listingApi.getRecommendedProducts(productId, 4);
        if (response.success) {
          setProducts(response.data);
        }
      } catch (err) {
        console.error("Error fetching recommended products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [productId]);

  // Không render nếu không có dữ liệu
  if (!loading && products.length === 0) return null;

  return (
    <section className="flex-col items-start gap-2 px-[196px] py-16 flex relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
        Recommended Products
      </h2>

      {loading ? (
        <div className="flex items-center justify-center w-full py-10">
          <div className="w-8 h-8 border-2 border-x-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          {products.map((product) => {
            // Lấy ảnh chính
            const image =
              product.media?.find((m) => m.isPrimary)?.url ||
              product.media?.[0]?.url ||
              "/textures/productdetailpage/image7.jpg";

            // Giá
            const minPrice = product.variants?.length
              ? Math.min(...product.variants.map((v) => v.price || product.base_price))
              : product.base_price;

            // Màu đầu tiên
            const firstColor = product.variants?.find((v) => v.attributes?.color)?.attributes?.color || "";

            return (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="flex flex-col items-start gap-2.5 relative flex-1 grow no-underline"
              >
                <img
                  className="w-full h-[392px] relative self-stretch object-cover"
                  alt={product.name}
                  src={image}
                />

                <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-start gap-3 px-0 py-2 relative self-stretch w-full flex-[0_0_auto]">
                    <h3 className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                      {product.name}
                    </h3>

                    <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
                      {minPrice < product.base_price && (
                        <span className="relative w-fit mt-[-1.00px] font-text-200-strikethrough font-[number:var(--text-200-strikethrough-font-weight)] text-x-300 text-[length:var(--text-200-strikethrough-font-size)] text-right tracking-[var(--text-200-strikethrough-letter-spacing)] leading-[var(--text-200-strikethrough-line-height)] line-through whitespace-nowrap [font-style:var(--text-200-strikethrough-font-style)]">
                          {product.base_price.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                      <span className="w-fit font-text-200-demi text-x-500 text-[length:var(--text-200-demi-font-size)] text-right tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap relative mt-[-1.00px] font-[number:var(--text-200-demi-font-weight)] [font-style:var(--text-200-demi-font-style)]">
                        {minPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>

                  <p className="relative self-stretch h-4 font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                    {firstColor}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
