import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS = {
    pending_payment: "Pending Payment",
    created: "Awaiting Delivery",
    confirmed: "Awaiting Delivery",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

const ORDER_STATUS_TABS = [
    { id: "all", label: "All", match: () => true },
    { id: "pending_payment", label: "Pending Payment", match: (order) => order.status === "pending_payment" },
    { id: "shipped", label: "Shipped", match: (order) => order.status === "shipped" },
    { id: "awaiting_delivery", label: "Awaiting Delivery", match: (order) => ["created", "confirmed"].includes(order.status) },
    { id: "delivered", label: "Delivered", match: (order) => order.status === "delivered" },
    { id: "cancelled", label: "Cancelled", match: (order) => order.status === "cancelled" },
    { id: "refunded", label: "Refunded", match: (order) => order.status === "refunded" },
];

const ORDER_STATUS_META = {
    pending_payment: { note: "Order pending payment", textColor: "text-gray-700", finalLabel: "PENDING PAYMENT", finalColor: "text-gray-900" },
    created: { note: "Order is being prepared", textColor: "text-gray-700", finalLabel: "AWAITING DELIVERY", finalColor: "text-gray-900" },
    confirmed: { note: "Order is being prepared", textColor: "text-gray-700", finalLabel: "AWAITING DELIVERY", finalColor: "text-gray-900" },
    shipped: { note: "Order is shipping", textColor: "text-gray-700", finalLabel: "SHIPPED", finalColor: "text-gray-900" },
    delivered: { note: "Delivered successfully", textColor: "text-gray-700", finalLabel: "DELIVERED", finalColor: "text-gray-900" },
    cancelled: { note: "Order cancelled", textColor: "text-gray-700", finalLabel: "CANCELLED", finalColor: "text-gray-900" },
    refunded: { note: "Order refunded", textColor: "text-gray-700", finalLabel: "REFUNDED", finalColor: "text-gray-900" },
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getProductIdFromItem = (item) => {
    if (!item?.productId) return "";
    if (typeof item.productId === "string") return item.productId;
    return item.productId?._id || "";
};

const OrdersTab = ({ orders, loading, error, onShop, onCancelOrder }) => {
    const navigate = useNavigate();
    const [activeStatusTab, setActiveStatusTab] = useState("all");

    const filteredOrders = useMemo(() => {
        const currentTab = ORDER_STATUS_TABS.find((tab) => tab.id === activeStatusTab) || ORDER_STATUS_TABS[0];
        return orders.filter((order) => currentTab.match(order));
    }, [orders, activeStatusTab]);

    if (loading) return <div className="py-16 text-center text-sm text-gray-500">Loading orders...</div>;
    if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>;

    if (!orders.length) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-sm text-gray-500">You do not have any orders yet.</p>
                <button type="button" onClick={onShop} className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
                    Start shopping
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <div className="inline-flex min-w-full items-center border-b border-gray-200 bg-gray-50 px-2">
                    {ORDER_STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveStatusTab(tab.id)}
                            className={`relative whitespace-nowrap px-5 py-3 text-base transition-colors ${activeStatusTab === tab.id ? "text-gray-900" : "text-gray-800 hover:text-gray-900"
                                }`}
                        >
                            {tab.label}
                            <span className={`absolute bottom-0 left-0 h-0.5 w-full ${activeStatusTab === tab.id ? "bg-gray-900" : "bg-transparent"}`} />
                        </button>
                    ))}
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <p className="text-sm text-gray-500">No orders in this status.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <article key={order.id || order.uuid} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-gray-900">{order.store_name || "Store"}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ref = order.store_uuid || order.store_id;
                                        if (ref) navigate(`/stores/${ref}`);
                                        else navigate("/stores");
                                    }}
                                    className="rounded bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                                >
                                    Chat
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ref = order.store_uuid || order.store_id;
                                        if (ref) navigate(`/stores/${ref}`);
                                        else navigate("/stores");
                                    }}
                                    className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700"
                                >
                                    View Shop
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className={`font-medium ${ORDER_STATUS_META[order.status]?.textColor || "text-gray-600"}`}>{ORDER_STATUS_META[order.status]?.note || STATUS_LABELS[order.status] || order.status}</span>
                                <span className="text-gray-300">|</span>
                                <span className={`font-semibold uppercase tracking-wide ${ORDER_STATUS_META[order.status]?.finalColor || "text-gray-600"}`}>
                                    {ORDER_STATUS_META[order.status]?.finalLabel || STATUS_LABELS[order.status] || order.status}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {(order.items || []).map((item, index) => {
                                const productId = getProductIdFromItem(item);
                                const unitPrice = Number(item.price || 0);
                                const quantity = Number(item.qty || 0);
                                const lineTotal = Number(item.subtotal || unitPrice * quantity);
                                const oldLineTotal = Number(item.discount || 0) > 0 ? lineTotal + Number(item.discount || 0) * quantity : 0;

                                return (
                                    <div key={`${order.uuid || order.id}-${index}`} className="flex gap-3 px-4 py-4">
                                        <img
                                            src={item.snapshot?.image || "/textures/productdetailpage/image7.jpg"}
                                            alt={item.snapshot?.name || "Product"}
                                            className="h-20 w-20 flex-shrink-0 rounded border border-gray-200 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`line-clamp-2 text-sm leading-6 text-gray-900 ${productId ? "cursor-pointer hover:text-gray-700" : ""}`}
                                                onClick={() => {
                                                    if (productId) navigate(`/product/${productId}`);
                                                }}
                                            >
                                                {item.snapshot?.name || "Product"}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">Variant: {item.snapshot?.variantName || "Default"}</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-700">x{quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            {oldLineTotal > 0 && <p className="text-sm text-gray-400 line-through">{formatVnd(oldLineTotal)}</p>}
                                            <p className="text-sm font-semibold text-gray-900">{formatVnd(lineTotal)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-gray-200 bg-white px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-gray-700">Total:</span>
                                <span className="text-xl font-semibold text-gray-900">{formatVnd(order.total_amount || 0)}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const firstProductId = getProductIdFromItem(order.items?.[0]);
                                        if (firstProductId) navigate(`/product/${firstProductId}`);
                                        else onShop();
                                    }}
                                    className="rounded bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Buy Again
                                </button>
                                {["created", "pending_payment"].includes(order.status) && (
                                    <button
                                        type="button"
                                        onClick={() => onCancelOrder(order.id || order._id)}
                                        className="rounded border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                                    >
                                        Hủy đơn
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ref = order.store_uuid || order.store_id;
                                        if (ref) navigate(`/stores/${ref}`);
                                        else navigate("/stores");
                                    }}
                                    className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
                                >
                                    Contact Seller
                                </button>
                            </div>
                        </div>
                    </article>
                ))
            )}
        </div>
    );
};

export default OrdersTab;
