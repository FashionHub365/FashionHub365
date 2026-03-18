import React from "react";

export const OrderSummary = ({ items, totalItems, totalAmount, shippingFee }) => (
    <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order ({totalItems} items)</h3>

            <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                    <div key={item.itemId} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                            <img
                                src={item.image || "/textures/cartpage/image.jpg"}
                                alt={item.name}
                                className="w-16 h-20 object-cover"
                            />
                            <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium leading-snug truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{item.price.toLocaleString("vi-VN")}₫</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping Fee</span>
                    <span>{shippingFee === 0 ? <span className="text-green-600 font-medium">Free</span> : `${shippingFee.toLocaleString("vi-VN")}₫`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{(totalAmount + shippingFee).toLocaleString("vi-VN")}₫</span>
                </div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
            {[
                { icon: "🔒", text: "Safe & Secure Payment" },
                { icon: "↩️", text: "30-Day Returns" },
                { icon: "📦", text: "Fast Delivery 2-5 Days" },
            ].map((b) => (
                <div key={b.text} className="flex items-center gap-2 py-1.5">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-xs text-gray-600">{b.text}</span>
                </div>
            ))}
        </div>
    </div>
);
