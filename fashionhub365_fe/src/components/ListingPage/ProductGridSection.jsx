import React, { useState } from "react";
import { FilterSidebar } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";
import { ListingHeader } from "./ListingHeader";

export const ProductGridSection = () => {

// Dummy logic for products to match user request structure
const products = [
  {
    id: 1,
    image: "/textures/listingpage/image.jpg",
    name: "The Cloud Relaxed Cardigan",
    originalPrice: 188,
    salePrice: 132,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#3a3840" },
      { hex: "#8c7058" },
      { hex: "#262525" },
    ],
    discount: "30% off",
  },
  {
    id: 2,
    image: "/textures/listingpage/image-2.jpg",
    name: "The Organic Cotton Long-Sleeve Turtleneck",
    originalPrice: 50,
    salePrice: 35,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#262525" },
      { hex: "#222630" },
    ],
    badges: ["ORGANIC COTTON"],
    discount: "30% off",
  },
  {
    id: 3,
    image: "/textures/listingpage/image-3.jpg",
    name: "The Wool Flannel Pant",
    originalPrice: 138,
    salePrice: 97,
    color: "Heather Charcoal",
    colors: [{ hex: "#4a4e4f", selected: true }, { hex: "#5c604b" }],
    badges: ["RENWED MATERIALS", "CLEANER CHEMISTRY"],
    discount: "30% off",
  },
    {
    id: 4,
    image: "/textures/listingpage/image-4.jpg",
    name: "The Cloud Relaxed Cardigan",
    originalPrice: 188,
    salePrice: 132,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#3a3840" },
      { hex: "#8c7058" },
      { hex: "#262525" },
    ],
    discount: "30% off",
  },
  {
    id: 5,
    image: "/textures/listingpage/image-5.jpg",
    name: "The Organic Cotton Long-Sleeve Turtleneck",
    originalPrice: 50,
    salePrice: 35,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#262525" },
      { hex: "#222630" },
    ],
    badges: ["ORGANIC COTTON"],
    discount: "30% off",
  },
  {
    id: 6,
    image: "/textures/listingpage/image-6.jpg",
    name: "The Wool Flannel Pant",
    originalPrice: 138,
    salePrice: 97,
    color: "Heather Charcoal",
    colors: [{ hex: "#4a4e4f", selected: true }, { hex: "#5c604b" }],
    badges: ["RENWED MATERIALS", "CLEANER CHEMISTRY"],
    discount: "30% off",
  },
    {
    id: 7,
    image: "/textures/listingpage/image-7.jpg",
    name: "The Cloud Relaxed Cardigan",
    originalPrice: 188,
    salePrice: 132,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#3a3840" },
      { hex: "#8c7058" },
      { hex: "#262525" },
    ],
    discount: "30% off",
  },
  {
    id: 8,
    image: "/textures/listingpage/image-8.jpg",
    name: "The Organic Cotton Long-Sleeve Turtleneck",
    originalPrice: 50,
    salePrice: 35,
    color: "Black",
    colors: [
      { hex: "#514535", selected: true },
      { hex: "#262525" },
      { hex: "#222630" },
    ],
    badges: ["ORGANIC COTTON"],
    discount: "30% off",
  },
  {
    id: 9,
    image: "/textures/listingpage/image-9.jpg",
    name: "The Wool Flannel Pant",
    originalPrice: 138,
    salePrice: 97,
    color: "Heather Charcoal",
    colors: [{ hex: "#4a4e4f", selected: true }, { hex: "#5c604b" }],
    badges: ["RENWED MATERIALS", "CLEANER CHEMISTRY"],
    discount: "30% off",
  },
];

  return (
    <section className="flex items-start gap-4 px-4 md:px-20 py-[30px] relative self-stretch w-full flex-[0_0_auto]">
      <FilterSidebar />
      <main className="flex flex-col items-start relative flex-1 grow">
        <ListingHeader />
        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          {[0, 1, 2].map((rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-col md:flex-row items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
            >
              {products.slice(rowIndex * 3, rowIndex * 3 + 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </main>
    </section>
  );
};
