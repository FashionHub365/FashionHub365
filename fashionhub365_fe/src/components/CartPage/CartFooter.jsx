import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

export const CartFooter = ({ totalAmount, itemCount }) => {
  const { setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <section className="flex flex-col items-start gap-4 px-6 py-6 relative self-stretch w-full flex-shrink-0 bg-white border-t border-x-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      {/* Subtotal */}
      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
          <h2 className="relative w-fit font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] whitespace-nowrap [font-style:var(--text-400-demi-font-style)]">
            Subtotal
          </h2>
          <span className="text-sm text-x-300">({itemCount} items)</span>
        </div>

        <div className="font-text-400-demi text-x-600 text-[length:var(--text-400-demi-font-size)] text-right tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] font-[number:var(--text-400-demi-font-weight)] [font-style:var(--text-400-demi-font-style)]">
          {totalAmount.toLocaleString("vi-VN")}₫
        </div>
      </div>

      {/* Shipping note */}
      <p className="text-xs text-x-300 w-full text-center">
        Free shipping on orders over <strong>1.000.000₫</strong>
      </p>

      {/* Checkout button */}
      <button
        type="button"
        onClick={handleCheckout}
        className="all-[unset] box-border self-stretch w-full flex items-center justify-center gap-2 px-0 py-3.5 bg-x-500 cursor-pointer hover:bg-black transition-colors"
        aria-label="Continue to checkout"
      >
        <span className="font-text-300 text-white text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] font-[number:var(--text-300-font-weight)] [font-style:var(--text-300-font-style)]">
          CONTINUE TO CHECKOUT
        </span>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>

      <p className="relative self-stretch font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-600 text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] [font-style:var(--text-200-demi-font-style)]">
        Psst, get it now before it sells out.
      </p>
    </section>
  );
};
