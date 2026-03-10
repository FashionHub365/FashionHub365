import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import addressApi from "../apis/addressApi";
import checkoutApi from "../apis/checkoutApi";
import wishlistApi from "../apis/wishlistApi";
import { Trash } from "../components/Icons";
import { useAuth } from "../contexts/AuthContext";

const EMPTY_ADDRESS_FORM = {
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    ward: "",
    district: "",
    city: "",
    note: "",
    is_default: false,
};

const STATUS_LABELS = {
    pending_payment: "Chờ thanh toán",
    created: "Chờ giao hàng",
    confirmed: "Chờ giao hàng",
    shipped: "Vận chuyển",
    delivered: "Hoàn thành",
    cancelled: "Đã hủy",
    refunded: "Trả hàng/Hoàn tiền",
};

const ORDER_STATUS_TABS = [
    { id: "all", label: "Tất cả", match: () => true },
    { id: "pending_payment", label: "Chờ thanh toán", match: (order) => order.status === "pending_payment" },
    { id: "shipped", label: "Vận chuyển", match: (order) => order.status === "shipped" },
    { id: "awaiting_delivery", label: "Chờ giao hàng", match: (order) => ["created", "confirmed"].includes(order.status) },
    { id: "delivered", label: "Hoàn thành", match: (order) => order.status === "delivered" },
    { id: "cancelled", label: "Đã hủy", match: (order) => order.status === "cancelled" },
    { id: "refunded", label: "Trả hàng/Hoàn tiền", match: (order) => order.status === "refunded" },
];

const ORDER_STATUS_META = {
    pending_payment: { note: "Đơn hàng chờ thanh toán", textColor: "text-gray-700", finalLabel: "CHỜ THANH TOÁN", finalColor: "text-gray-900" },
    created: { note: "Đơn hàng đang được chuẩn bị", textColor: "text-gray-700", finalLabel: "CHỜ GIAO HÀNG", finalColor: "text-gray-900" },
    confirmed: { note: "Đơn hàng đang được chuẩn bị", textColor: "text-gray-700", finalLabel: "CHỜ GIAO HÀNG", finalColor: "text-gray-900" },
    shipped: { note: "Đơn hàng đang vận chuyển", textColor: "text-gray-700", finalLabel: "VẬN CHUYỂN", finalColor: "text-gray-900" },
    delivered: { note: "Giao hàng thành công", textColor: "text-gray-700", finalLabel: "HOÀN THÀNH", finalColor: "text-gray-900" },
    cancelled: { note: "Đơn hàng đã hủy", textColor: "text-gray-700", finalLabel: "ĐÃ HỦY", finalColor: "text-gray-900" },
    refunded: { note: "Đơn hàng đã hoàn tiền", textColor: "text-gray-700", finalLabel: "TRẢ HÀNG/HOÀN TIỀN", finalColor: "text-gray-900" },
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getProductIdFromItem = (item) => {
    if (!item?.productId) return "";
    if (typeof item.productId === "string") return item.productId;
    return item.productId?._id || "";
};

const toCheckoutShipping = (address, email = "") => ({
    uuid: address.uuid,
    full_name: address.full_name || "",
    phone: address.phone || "",
    email,
    province: address.city || "",
    district: address.district || "",
    ward: address.ward || "",
    address_line: [address.line1, address.line2].filter(Boolean).join(", "),
    note: address.note || "",
});

const TabIcon = ({ id }) => {
    if (id === "profile") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        );
    }
    if (id === "orders") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        );
    }
    if (id === "addresses") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        );
    }
    if (id === "wishlist") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        );
    }
    return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
};

const OrdersTab = ({ orders, loading, error, onShop }) => {
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
                            className={`relative whitespace-nowrap px-5 py-3 text-base transition-colors ${
                                activeStatusTab === tab.id ? "text-gray-900" : "text-gray-800 hover:text-gray-900"
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
                    <p className="text-sm text-gray-500">Không có đơn hàng ở trạng thái này.</p>
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
                                    Xem Shop
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
                                                {item.snapshot?.name || "Sản phẩm"}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">Phân loại hàng: {item.snapshot?.variantName || "Mặc định"}</p>
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
                                <span className="text-sm text-gray-700">Thành tiền:</span>
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
                                    Mua Lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ref = order.store_uuid || order.store_id;
                                        if (ref) navigate(`/stores/${ref}`);
                                        else navigate("/stores");
                                    }}
                                    className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
                                >
                                    Liên Hệ Người Bán
                                </button>
                            </div>
                        </div>
                    </article>
                ))
            )}
        </div>
    );
};

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
                    <button type="button" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} className="rounded border px-3 py-1 text-sm">
                        Prev
                    </button>
                    <span className="text-sm text-gray-600">
                        {currentPage}/{totalPages}
                    </span>
                    <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} className="rounded border px-3 py-1 text-sm">
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const AddressesTab = ({ addresses, loading, error, submitting, onSave, onDelete, onSetDefault, onUseForCheckout }) => {
    const [editingUuid, setEditingUuid] = useState(null);
    const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
    const [localError, setLocalError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    const resetForm = () => {
        setEditingUuid(null);
        setForm(EMPTY_ADDRESS_FORM);
        setLocalError("");
        setIsFormOpen(false);
    };

    const startEdit = (address) => {
        setEditingUuid(address.uuid);
        setIsFormOpen(true);
        setForm({
            full_name: address.full_name || "",
            phone: address.phone || "",
            line1: address.line1 || "",
            line2: address.line2 || "",
            ward: address.ward || "",
            district: address.district || "",
            city: address.city || "",
            note: address.note || "",
            is_default: !!address.is_default,
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.phone || !form.line1 || !form.district || !form.city) {
            setLocalError("Please fill required fields.");
            return;
        }
        const ok = await onSave(form, editingUuid);
        if (ok) resetForm();
    };

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 p-4 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-white/70">Address Book</p>
                            <p className="mt-1 text-lg font-bold">{addresses.length} saved address(es)</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingUuid(null);
                                setForm(EMPTY_ADDRESS_FORM);
                                setLocalError("");
                                setIsFormOpen(true);
                            }}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
                        >
                            + Add address
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                {loading && <div className="py-8 text-center text-sm text-gray-500">Loading addresses...</div>}
                {!loading && addresses.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No saved addresses yet. Click "Add address" to create one.</div>}
                {!loading &&
                    addresses.map((address) => (
                        <article key={address.uuid} className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900">{address.full_name}</p>
                                        {address.is_default && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Default</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{address.phone}</p>
                                    <p className="mt-1 text-sm text-gray-700">{[address.line1, address.line2, address.ward, address.district, address.city].filter(Boolean).join(", ")}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => onUseForCheckout(address)} className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">
                                        Use checkout
                                    </button>
                                    {!address.is_default && (
                                        <button type="button" onClick={() => onSetDefault(address.uuid)} className="rounded border px-3 py-1.5 text-xs font-semibold text-gray-700">
                                            Set default
                                        </button>
                                    )}
                                    <button type="button" onClick={() => startEdit(address)} className="rounded border px-3 py-1.5 text-xs font-semibold text-gray-700">
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => onDelete(address.uuid)} className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
            </section>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-500">Address Form</p>
                                <h4 className="text-lg font-bold text-gray-900">{editingUuid ? "Update address" : "Create new address"}</h4>
                            </div>
                            <button type="button" onClick={resetForm} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                Close
                            </button>
                        </div>

                        <form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-2">
                            <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name *" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-1" />
                            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone *" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-1" />
                            <input value={form.line1} onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))} placeholder="Address line 1 *" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-2" />
                            <input value={form.line2} onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))} placeholder="Address line 2" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-2" />
                            <input value={form.ward} onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))} placeholder="Ward" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800" />
                            <input value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} placeholder="District *" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800" />
                            <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City/Province *" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-1" />
                            <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Note for courier" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-800 sm:col-span-1" />
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} />
                                Set as default address
                            </label>
                            {(localError || error) && <p className="text-sm text-rose-700 sm:col-span-2">{localError || error}</p>}
                            <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
                                <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                                    {submitting ? "Saving..." : editingUuid ? "Update address" : "Save address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.tab || "orders");
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");
    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [addressesError, setAddressesError] = useState("");
    const [addressesSubmitting, setAddressesSubmitting] = useState(false);

    useEffect(() => {
        if (location.state?.tab) setActiveTab(location.state.tab);
    }, [location.state]);

    const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError("");
        try {
            const res = await checkoutApi.getMyOrders();
            if (res.success) setOrders(res.data || []);
        } catch {
            setOrdersError("Cannot load orders.");
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchWishlist = async (page) => {
        setLoadingWishlist(true);
        try {
            const res = await wishlistApi.getWishlist(page, 6);
            if (res.success) {
                setWishlist(res.data.items || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } finally {
            setLoadingWishlist(false);
        }
    };

    const fetchAddresses = async () => {
        setAddressesLoading(true);
        setAddressesError("");
        try {
            const res = await addressApi.getAddresses();
            if (res.success) {
                const list = res.data?.addresses || res.data || [];
                setAddresses(Array.isArray(list) ? list : []);
            }
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot load addresses.");
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "orders" || activeTab === "profile") fetchOrders();
        if (activeTab === "wishlist" && user) fetchWishlist(currentPage);
        if ((activeTab === "addresses" || activeTab === "profile") && user) fetchAddresses();
    }, [activeTab, user, currentPage]);

    const saveAddress = async (payload, uuid) => {
        setAddressesSubmitting(true);
        setAddressesError("");
        try {
            if (uuid) await addressApi.updateAddress(uuid, payload);
            else await addressApi.createAddress(payload);
            await fetchAddresses();
            return true;
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot save address.");
            return false;
        } finally {
            setAddressesSubmitting(false);
        }
    };

    const deleteAddress = async (uuid) => {
        if (!window.confirm("Delete this address?")) return;
        try {
            await addressApi.deleteAddress(uuid);
            await fetchAddresses();
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot delete address.");
        }
    };

    const setDefaultAddress = async (uuid) => {
        try {
            await addressApi.setDefaultAddress(uuid);
            await fetchAddresses();
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot set default address.");
        }
    };

    const useForCheckout = (address) => {
        sessionStorage.setItem("checkout_shipping", JSON.stringify(toCheckoutShipping(address, user?.email || "")));
        navigate("/checkout");
    };

    const removeWishlist = async (productId) => {
        await wishlistApi.removeFromWishlist(productId);
        fetchWishlist(currentPage);
    };

    const summary = useMemo(
        () => ({
            totalOrders: orders.length,
            pendingOrders: orders.filter((o) => ["pending_payment", "created"].includes(o.status)).length,
            completedOrders: orders.filter((o) => o.status === "delivered").length,
            cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
            totalSpent: orders
                .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
                .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
            totalAddresses: addresses.length,
            wishlistItems: wishlist.length,
        }),
        [orders, addresses, wishlist]
    );

    const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
    const defaultAddress = useMemo(() => addresses.find((a) => a.is_default) || addresses[0] || null, [addresses]);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex h-screen items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Overview" },
        { id: "orders", label: "Orders" },
        { id: "addresses", label: "Addresses" },
        { id: "wishlist", label: "Wishlist" },
        { id: "settings", label: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="absolute top-0 z-0 h-56 w-full overflow-hidden bg-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_35%)]" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.full_name || user.username || "User")}&background=111827&color=fff&size=256`}
                                alt={user.username || "User"}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="text-gray-900">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Account</p>
                            <h1 className="mt-1 text-2xl font-bold text-gray-900">{user.profile?.full_name || user.username}</h1>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            navigate("/login");
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-900"
                    >
                        Sign out
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                        activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    <span className={`rounded-lg p-1 ${activeTab === tab.id ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}>
                                        <TabIcon id={tab.id} />
                                    </span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                            <p className="font-semibold text-gray-800">Quick stats</p>
                            <p className="mt-1">Orders: {summary.totalOrders}</p>
                            <p>Addresses: {summary.totalAddresses}</p>
                            <p>Wishlist: {summary.wishlistItems}</p>
                        </div>
                    </aside>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-900">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                            <p className="text-xs text-gray-600">Updated: {new Date().toLocaleDateString("vi-VN")}</p>
                        </div>

                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-500">Total Orders</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-500">Pending Orders</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{summary.pendingOrders}</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-500">Saved Addresses</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{summary.totalAddresses}</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-500">Wishlist Items</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{summary.wishlistItems}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs text-gray-500">Completed Orders</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{summary.completedOrders}</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs text-gray-500">Cancelled Orders</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{summary.cancelledOrders}</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs text-gray-500">Total Spent</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{summary.totalSpent.toLocaleString("vi-VN")} VND</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account Details</p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                                            <p className="text-xs text-gray-500">Full name</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{user.profile?.full_name || "Not set"}</p>
                                        </div>
                                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Default Shipping Address</p>
                                            <button type="button" onClick={() => setActiveTab("addresses")} className="text-xs font-semibold text-gray-700 underline">
                                                Manage
                                            </button>
                                        </div>
                                        {defaultAddress ? (
                                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                                <p className="text-sm font-semibold text-gray-900">{defaultAddress.full_name}</p>
                                                <p className="text-xs text-gray-500">{defaultAddress.phone}</p>
                                                <p className="mt-1 text-sm text-gray-700">{[defaultAddress.line1, defaultAddress.line2, defaultAddress.ward, defaultAddress.district, defaultAddress.city].filter(Boolean).join(", ")}</p>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                                                You have not added any shipping address yet.
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent Orders</p>
                                            <button type="button" onClick={() => setActiveTab("orders")} className="text-xs font-semibold text-gray-700 underline">
                                                View all
                                            </button>
                                        </div>
                                        {recentOrders.length > 0 ? (
                                            <div className="space-y-2">
                                                {recentOrders.map((order) => (
                                                    <div key={order.uuid || order.id} className="rounded-xl border border-gray-200 bg-white p-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-semibold text-gray-900">#{(order.uuid || "").slice(0, 8).toUpperCase()}</p>
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{STATUS_LABELS[order.status] || order.status}</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                                                        <p className="mt-1 text-sm font-semibold text-gray-900">{Number(order.total_amount || 0).toLocaleString("vi-VN")} VND</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">No recent orders.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "orders" && <OrdersTab orders={orders} loading={ordersLoading} error={ordersError} onShop={() => navigate("/listing")} />}

                        {activeTab === "addresses" && (
                            <AddressesTab
                                addresses={addresses}
                                loading={addressesLoading}
                                error={addressesError}
                                submitting={addressesSubmitting}
                                onSave={saveAddress}
                                onDelete={deleteAddress}
                                onSetDefault={setDefaultAddress}
                                onUseForCheckout={useForCheckout}
                            />
                        )}

                        {activeTab === "wishlist" && (
                            <WishlistTab
                                wishlist={wishlist}
                                loading={loadingWishlist}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                onRemove={removeWishlist}
                                onOpenProduct={(id) => navigate(`/product/${id}`)}
                            />
                        )}

                        {activeTab === "settings" && (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">Security settings UI will be added next.</div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
