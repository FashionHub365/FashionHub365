import React from "react";

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatDiscount = (voucher) => {
    if (voucher.discount_type === "percent") {
        return voucher.max_discount
            ? `${voucher.discount_value}% off, up to ${formatCurrency(voucher.max_discount)}`
            : `${voucher.discount_value}% off`;
    }
    return `${formatCurrency(voucher.discount_value)} off`;
};

const VoucherShelfSection = ({
    title,
    description,
    vouchers = [],
    claimedCodes = new Set(),
    claimingVoucherId = "",
    emptyMessage = "No vouchers available right now.",
    onClaimVoucher,
    onOpenWallet,
}) => {
    return (
        <section className="w-full px-4 md:px-8 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 font-semibold">Voucher Collection</p>
                        <h2 className="mt-2 text-2xl md:text-3xl font-black text-gray-900">{title}</h2>
                        <p className="mt-2 text-sm text-gray-500 max-w-2xl leading-6">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenWallet}
                        className="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        View my vouchers
                    </button>
                </div>

                {vouchers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {vouchers.map((voucher) => {
                            const isClaimed = claimedCodes.has(voucher.code) || Boolean(voucher.isClaimed);
                            const isClaiming = claimingVoucherId === (voucher._id || voucher.uuid);
                            const minOrder = voucher.min_order_amount ?? voucher.min_order_value ?? 0;

                            return (
                                <article key={voucher._id || voucher.uuid || voucher.code} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${voucher.store_id ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"}`}>
                                                {voucher.store_id ? "Store Voucher" : "Platform Voucher"}
                                            </span>
                                            <h3 className="mt-3 text-lg font-bold text-gray-900">{voucher.name || voucher.code}</h3>
                                        </div>
                                        <span className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-gray-900">
                                            {voucher.code}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-emerald-600">{formatDiscount(voucher)}</p>
                                    <p className="mt-2 min-h-[44px] text-sm leading-6 text-gray-500">
                                        {voucher.description || "Save this voucher now and use it later when your order matches the conditions."}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                            Min. order {formatCurrency(minOrder)}
                                        </span>
                                        {voucher.end_date && (
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                Until {new Date(voucher.end_date).toLocaleDateString("vi-VN")}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onClaimVoucher(voucher)}
                                        disabled={isClaimed || isClaiming}
                                        className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                                            isClaimed
                                                ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                                                : isClaiming
                                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                    : "bg-gray-900 text-white hover:bg-black"
                                        }`}
                                    >
                                        {isClaimed ? "Saved to wallet" : isClaiming ? "Saving..." : "Save voucher"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default VoucherShelfSection;
