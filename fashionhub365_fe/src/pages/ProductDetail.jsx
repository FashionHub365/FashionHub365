import React from "react";
import { ProductDetailsSection } from "../components/ProductDetailPage/ProductDetailsSection";
import { ReviewsSection } from "../components/ProductDetailPage/ReviewsSection";
import { TransparentPricingSection } from "../components/ProductDetailPage/TransparentPricingSection";
import { RecommendedProductsSection } from "../components/ProductDetailPage/RecommendedProductsSection";

export const ProductDetail = () => {
  return (
    <div className="flex flex-col items-start relative bg-white w-full">
      <ProductDetailsSection />
      <RecommendedProductsSection />
      <ReviewsSection />
      <TransparentPricingSection />
    </div>
  );
};
