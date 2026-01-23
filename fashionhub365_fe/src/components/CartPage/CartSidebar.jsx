import React from "react";
import { X } from "../Icons";
import { CartItem } from "./CartItem";
import { CartRecommendations } from "./CartRecommendations";
import { CartFooter } from "./CartFooter";

export const CartSidebar = ({ isOpen, onClose }) => {
  const cartItems = [
    {
      id: 1,
      name: "The Organic Cotton Long-Sleeve Turtleneck",
      size: "Medium",
      color: "Black",
      price: 35,
      originalPrice: 50,
      image: "/textures/cartpage/image.jpg", // Placeholder
      discountLabel: "(30% Off)",
      quantity: 1,
    },
    {
      id: 2,
      name: "The ReWool® Oversized Shirt Jacket",
      size: "Small",
      color: "Black",
      price: 167,
      originalPrice: 238,
      image: "/textures/cartpage/image-2.jpg", // Placeholder
      discountLabel: "(30% Off)",
      quantity: 1,
    },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-cart overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-x-200">
            <h2 className="font-display-200 text-x-600 custom-font-title">
              Your Cart
            </h2>
            <button onClick={onClose} aria-label="Close cart">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            {cartItems.map((item) => (
              <CartItem key={item.id} product={item} />
            ))}
            
            <div className="h-px bg-x-200 w-full my-2" />
            
            <CartRecommendations />
          </div>

          {/* Footer */}
          <CartFooter subtotal={subtotal} itemCount={cartItems.length} />
        </div>
      </aside>
    </>
  );
};
