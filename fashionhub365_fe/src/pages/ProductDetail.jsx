import React from "react";
import { HeaderSection } from "../components/HeaderSection";
import { FooterSection } from "../components/FooterSection";
import { ProductDetailsSection } from "../components/ProductDetailPage/ProductDetailsSection";
import { ReviewsSection } from "../components/ProductDetailPage/ReviewsSection";
import { TransparentPricingSection } from "../components/ProductDetailPage/TransparentPricingSection";
import { RecommendedProductsSection } from "../components/ProductDetailPage/RecommendedProductsSection";

export const ProductDetail = () => {
  return (
    <div className="flex flex-col items-start relative bg-white w-full">
      <HeaderSection />
      <ProductDetailsSection />
      <RecommendedProductsSection />
      <ReviewsSection />
      <TransparentPricingSection />
      <FooterSection />
    </div>
  );
};
