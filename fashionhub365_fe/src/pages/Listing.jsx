import React from "react";
import { HeaderSection } from "../components/HeaderSection";
import { FooterSection } from "../components/FooterSection";
import { ProductGridSection } from "../components/ListingPage/ProductGridSection";

export const Listing = () => {
  return (
    <div className="flex flex-col items-start relative bg-white min-h-screen">
      <HeaderSection />
      <ProductGridSection />
      <FooterSection />
    </div>
  );
};
