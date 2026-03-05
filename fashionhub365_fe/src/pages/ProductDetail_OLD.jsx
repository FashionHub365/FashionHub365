import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProductDetailsSection } from "../components/ProductDetailPage/ProductDetailsSection";
import { ReviewsSection } from "../components/ProductDetailPage/ReviewsSection";
import { TransparentPricingSection } from "../components/ProductDetailPage/TransparentPricingSection";
import { RecommendedProductsSection } from "../components/ProductDetailPage/RecommendedProductsSection";
import listingApi from "../apis/listingApi";

/**
 * ProductDetail Page
 * Đọc :id từ URL, fetch data từ API, truyền xuống các section con
 * Hỗ trợ cả route /product/:id (có ID) và /product-detail (không có ID - fallback UI tĩnh)
 */
export const ProductDetail = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return; // Không có ID → hiển thị UI tĩnh (fallback)

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listingApi.getProductById(id);
        if (response.success) {
          setProduct(response.data);
        }
      } catch (err) {
        console.error("Error fetching product detail:", err);
        setError("Không tìm thấy sản phẩm hoặc đã xảy ra lỗi.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <div className="flex flex-col items-start relative bg-white w-full">


      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center w-full py-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-x-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-text-200 text-x-400">Đang tải sản phẩm...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center justify-center w-full py-40">
          <p className="font-text-200 text-red-500">{error}</p>
        </div>
      )}

      {/* Product content */}
      {!loading && !error && (
        <>
          <ProductDetailsSection product={product} />
          {product && <RecommendedProductsSection productId={product._id} />}
          <ReviewsSection />
          <TransparentPricingSection />
        </>
      )}
    </div>
  );
};
