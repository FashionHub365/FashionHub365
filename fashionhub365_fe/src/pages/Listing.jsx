import React from "react";
import { ProductGridSection } from "../components/ListingPage/ProductGridSection";

export const Listing = () => {
  return (
    <div className="flex flex-col items-start relative bg-white min-h-screen">
      <ProductGridSection />
    </div>
  );
};
