import React, { useState } from "react";
import { Minus, Plus, Trash } from "../Icons";

export const CartItem = ({ product }) => {
  const [quantity, setQuantity] = useState(product.quantity || 1);

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleRemove = () => {
    console.log("Remove item from cart");
  };

  return (
    <article className="flex items-start gap-4 self-stretch w-full relative flex-[0_0_auto]">
      <img
        className="w-[70px] h-[100px] relative object-cover"
        alt={product.name}
        src={product.image}
      />

      <div className="flex flex-col items-start text-left justify-between relative flex-1 self-stretch grow">
        <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start relative flex-1 grow">
            <p className="relative self-stretch mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
              {product.name}
            </p>

            <div className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              {product.size} | {product.color}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove item from cart"
            className="bg-transparent border-0 p-0 cursor-pointer"
          >
            <Trash className="!relative !w-3.5 !h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start relative flex-1 grow">
            <div className="items-center gap-0.5 flex relative self-stretch w-full flex-[0_0_auto]">
              {product.originalPrice && (
                <div className="mt-[-1.00px] font-text-200-strikethrough text-x-300 text-[length:var(--text-200-strikethrough-font-size)] tracking-[var(--text-200-strikethrough-letter-spacing)] leading-[var(--text-200-strikethrough-line-height)] line-through relative w-fit font-[number:var(--text-200-strikethrough-font-weight)] whitespace-nowrap [font-style:var(--text-200-strikethrough-font-style)]">
                  ${product.originalPrice}
                </div>
              )}

              <div className="mt-[-1.00px] font-text-200-demi text-x-500 text-[length:var(--text-200-demi-font-size)] tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] relative w-fit font-[number:var(--text-200-demi-font-weight)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                ${product.price}
              </div>
            </div>

            {product.discountLabel && (
              <div className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-red text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                {product.discountLabel}
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 border border-solid border-x-200 rounded-sm">
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              className="flex items-center justify-center p-1 hover:bg-x-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="min-w-[20px] text-center font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              {quantity}
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              className="flex items-center justify-center p-1 hover:bg-x-100 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
