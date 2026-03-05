import React, { useState } from "react";
import { Minus, Plus, Trash } from "../Icons";
import { useCart } from "../../contexts/CartContext";

export const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useCart();
  const [localQty, setLocalQty] = useState(item.quantity);
  const [inputVal, setInputVal] = useState(String(item.quantity));
  const [updating, setUpdating] = useState(false);

  const commitQty = async (val) => {
    const parsed = parseInt(val, 10);
    const maxStock = item.stock ?? 99; // Lấy stock từ backend, mặc định 99 nếu chưa có
    if (isNaN(parsed) || parsed < 1) {
      setInputVal(String(localQty)); // revert nếu không hợp lệ
      return;
    }
    const clamped = Math.min(Math.max(1, parsed), maxStock);
    setInputVal(String(clamped));
    if (clamped === localQty) return;
    setLocalQty(clamped);
    setUpdating(true);
    await updateItem(item.itemId, clamped);
    setUpdating(false);
  };

  const handleChange = async (newQty) => {
    const maxStock = item.stock ?? 99;
    if (newQty < 1 || newQty > maxStock) return;
    setLocalQty(newQty);
    setInputVal(String(newQty));
    setUpdating(true);
    await updateItem(item.itemId, newQty);
    setUpdating(false);
  };

  const handleRemove = () => removeItem(item.itemId);

  const subtotal = (item.price * localQty).toLocaleString("vi-VN");
  const maxStock = item.stock ?? 99;

  return (
    <article className="flex items-start gap-4 self-stretch w-full relative flex-[0_0_auto]">
      <img
        className="w-[70px] h-[100px] relative object-cover flex-shrink-0"
        alt={item.name}
        src={item.image || "/textures/cartpage/image.jpg"}
      />

      <div className="flex flex-col items-start text-left justify-between relative flex-1 self-stretch grow min-w-0">
        <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start relative flex-1 grow min-w-0">
            <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] truncate">
              {item.name}
            </p>

            <div className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)] mt-0.5">
              {item.variantName || "—"}
            </div>

            {!item.inStock && (
              <span className="text-red-500 text-xs mt-0.5 font-medium">Out of stock</span>
            )}
            {item.stock !== undefined && (
              <span className="text-xs text-x-400 mt-0.5 font-medium">Kho: {item.stock}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove item from cart"
            className="bg-transparent border-0 p-1 cursor-pointer flex-shrink-0 hover:opacity-60 transition-opacity mt-0.5"
          >
            <Trash className="!relative !w-4 !h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] mt-3">
          <div className="flex flex-col items-start relative">
            <div className="font-text-200-demi text-x-600 text-[length:var(--text-200-demi-font-size)] tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] font-[number:var(--text-200-demi-font-weight)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
              {subtotal}₫
            </div>
            <div className="text-xs text-x-300 mt-0.5">{item.price.toLocaleString("vi-VN")}₫ / item</div>
          </div>

          <div className={`inline-flex items-center border border-solid border-x-200 rounded-sm transition-opacity ${updating ? "opacity-50" : ""}`}>
            <button
              type="button"
              onClick={() => handleChange(localQty - 1)}
              aria-label="Decrease quantity"
              disabled={localQty <= 1 || updating}
              className="w-7 h-8 flex items-center justify-center hover:bg-x-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Input nhập tay */}
            <input
              type="number"
              min="1"
              max={maxStock}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={e => commitQty(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
              disabled={updating}
              className="w-10 h-8 text-center text-sm font-semibold text-x-600 border-x border-x-200 bg-transparent focus:outline-none focus:bg-gray-50 disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Quantity"
            />

            <button
              type="button"
              onClick={() => handleChange(localQty + 1)}
              aria-label="Increase quantity"
              disabled={localQty >= maxStock || updating}
              className="w-7 h-8 flex items-center justify-center hover:bg-x-100 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
