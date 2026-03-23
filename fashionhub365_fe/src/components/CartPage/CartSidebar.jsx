import React from "react";
import { X } from "../Icons";
import { CartItem } from "./CartItem";
import { CartRecommendations } from "./CartRecommendations";
import { CartFooter } from "./CartFooter";
import { useCart } from "../../contexts/CartContext";

export const CartSidebar = () => {
  const { cartData, isCartOpen, setIsCartOpen } = useCart();
  const { items = [], totalItems = 0, totalAmount = 0 } = cartData;

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[70] transition-opacity duration-300 backdrop-blur-[2px]"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-[80] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-x-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display-200 text-x-600 custom-font-title">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-x-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" className="p-1 hover:opacity-60 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
              <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-text-300 text-x-300">Your cart is empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 bg-x-600 text-white font-text-200-demi px-6 py-2.5 hover:bg-black transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <CartItem key={item.itemId} item={item} />
              ))}

              <div className="h-px bg-x-200 w-full my-2" />
              <CartRecommendations />
            </>
          )}
        </div>

        {/* Footer – only show when there are items */}
        {items.length > 0 && (
          <CartFooter totalAmount={totalAmount} itemCount={totalItems} />
        )}
      </aside>
    </>
  );
};
