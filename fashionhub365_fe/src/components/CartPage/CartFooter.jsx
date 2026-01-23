import React from "react";

export const CartFooter = ({ subtotal, itemCount }) => {
  return (
    <section className="flex flex-col items-start gap-8 px-5 py-[30px] relative self-stretch w-full flex-[0_0_auto] bg-white shadow-cart">
      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
          <h2 className="relative w-fit mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] whitespace-nowrap [font-style:var(--text-400-demi-font-style)]">
            Subtotal
          </h2>

          <span className="relative w-fit font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
            ({itemCount} items)
          </span>
        </div>

        <div className="mt-[-1.00px] font-text-400-demi text-x-600 text-[length:var(--text-400-demi-font-size)] text-right tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] relative w-fit font-[number:var(--text-400-demi-font-weight)] whitespace-nowrap [font-style:var(--text-400-demi-font-style)]">
          ${subtotal}
        </div>
      </div>

      <button
        type="button"
        className="all-[unset] box-border self-stretch w-full flex-[0_0_auto] flex items-center justify-center gap-2.5 px-0 py-3 relative bg-x-500 cursor-pointer"
        aria-label="Continue to checkout"
      >
        <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-white text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
          CONTINUE TO CHECKOUT
        </span>
      </button>

      <p className="relative self-stretch font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-600 text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] [font-style:var(--text-200-demi-font-style)]">
        Psst, get it now before it sells out.
      </p>
    </section>
  );
};
