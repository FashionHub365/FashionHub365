import React from "react";
import { Trash } from "../../components/Icons";

const WishlistTab = ({ wishlist, loading, currentPage, totalPages, onPageChange, onRemove, onOpenProduct }) => {
    if (loading) return <div className="py-16 text-center text-sm text-gray-500">Loading wishlist...</div>;
    if (!wishlist.length) return <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Wishlist is empty.</div>;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {wishlist.map((item) => {
                    const product = item.productId;
                    if (!product?._id) return null;
                    return (
                        <article key={product._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                            <div className="relative aspect-[3/4] bg-gray-100">
                                <img src={product.media?.[0]?.url || "/textures/productdetailpage/image7.jpg"} alt={product.name || "Product"} className="h-full w-full object-cover" />
                                <button type="button" onClick={() => onRemove(product._id)} className="absolute right-2 top-2 rounded-full border border-gray-200 bg-white p-2 text-rose-600">
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="line-clamp-1 text-sm font-semibold text-gray-900">{product.name}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-sm font-bold text-gray-900">{(product.base_price || 0).toLocaleString("vi-VN")} VND</p>
                                    <button type="button" onClick={() => onOpenProduct(product._id)} className="text-xs font-semibold text-gray-700 underline">
                                        View
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} className="rounded border px-3 py-1.5 text-sm">
                        Prev
                    </button>
                    <span className="text-sm text-gray-600">
                        {currentPage}/{totalPages}
                    </span>
                    <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} className="rounded border px-3 py-1.5 text-sm">
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default WishlistTab;
