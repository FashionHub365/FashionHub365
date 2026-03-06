import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import listingApi from "../apis/listingApi";
import { ProductDetailsSection } from "../components/ProductDetailPage/ProductDetailsSection";
import { ReviewsSection } from "../components/ProductDetailPage/ReviewsSection";
import { TransparentPricingSection } from "../components/ProductDetailPage/TransparentPricingSection";
import { RecommendedProductsSection } from "../components/ProductDetailPage/RecommendedProductsSection";

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
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listingApi.getProductById(id);
        if (response.success) {
          setProduct(response.data);
          // Track view count — fire-and-forget, không block UI
          listingApi.trackView(id).catch(() => { });
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
    <div className="flex flex-col items-start relative bg-white w-full min-h-screen">

      {/* Loading state - We show skeleton inside ProductDetailsSection now, 
          but if it's the first load and we want a full page loader: */}
      {/* {loading && <Loading className="py-40 w-full" size="xl" />} */}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center justify-center w-full py-40">
          <p className="font-text-200 text-red-500">{error}</p>
        </div>
      )}

      {/* Product content */}
      {(loading || (!error)) && (
        <>
          <ProductDetailsSection product={product} loading={loading} />
          {product && !loading && <RecommendedProductsSection productId={product._id} />}
          {product && !loading && <ReviewsSection productId={product._id} product={product} />}
          {!loading && <TransparentPricingSection />}
        </>
      )}
    </div>
  );
};
