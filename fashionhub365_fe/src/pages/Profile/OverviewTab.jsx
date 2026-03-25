import React from "react";

const STATUS_LABELS = {
    pending_payment: "Pending Payment",
    created: "Awaiting Confirmation",
    confirmed: "Awaiting Delivery",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

const OverviewTab = ({ user, summary, recentOrders, defaultAddress, onSetTab }) => {
    return (
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
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Saved Vouchers</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{summary.totalVouchers}</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-500">Voucher Wallet</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{summary.totalVouchers}</p>
                        </div>
                        <button type="button" onClick={() => onSetTab("vouchers")} className="text-xs font-semibold text-gray-700 underline">
                            Open
                        </button>
                    </div>
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
                        <button type="button" onClick={() => onSetTab("addresses")} className="text-xs font-semibold text-gray-700 underline">
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
                        <button type="button" onClick={() => onSetTab("orders")} className="text-xs font-semibold text-gray-700 underline">
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
    );
};

export default OverviewTab;
