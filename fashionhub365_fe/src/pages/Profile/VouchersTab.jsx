import React, { useMemo } from "react";

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatDiscount = (voucher) => {
    if (voucher.discount_type === "percent") {
        const maxDiscount = voucher.max_discount ? `, up to ${formatCurrency(voucher.max_discount)}` : "";
        return `${voucher.discount_value}% off${maxDiscount}`;
    }

    return `${formatCurrency(voucher.discount_value)} off`;
};

const formatDate = (value) => {
    if (!value) return "No expiry";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No expiry";
    return date.toLocaleDateString("vi-VN");
};

const VoucherCard = ({ voucher, actionLabel, actionDisabled, actionTone = "dark", helperText, onAction }) => {
    const minOrderValue = voucher.min_order_amount ?? voucher.min_order_value ?? 0;
    const remaining = Math.max(0, Number(voucher.usage_limit || 0) - Number(voucher.used_count || 0));

    return (
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">
                            {voucher.store_id ? "Store Voucher" : "Platform Voucher"}
                        </span>
                        <h3 className="mt-3 text-lg font-bold text-gray-900">{voucher.name || voucher.code}</h3>
                        <p className="mt-2 inline-flex rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold tracking-[0.18em] text-gray-900">
                            {voucher.code}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-gray-900 px-4 py-3 text-right text-white">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-300">Benefit</p>
                        <p className="mt-1 text-sm font-semibold">{formatDiscount(voucher)}</p>
                    </div>
                </div>

                <p className="min-h-[40px] text-sm leading-6 text-gray-600">
                    {voucher.description || "Use this voucher on eligible orders to save more on your next purchase."}
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Minimum order</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(minOrderValue)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Valid until</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(voucher.end_date)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Remaining lượt</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{remaining}</p>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">{helperText}</p>
                    <button
                        type="button"
                        onClick={onAction}
                        disabled={actionDisabled}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            actionTone === "green"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-200"
                                : "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300"
                        }`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </article>
    );
};

const VouchersTab = ({
    activeVouchers,
    myVouchers,
    loadingActive,
    loadingMine,
    activeError,
    myError,
    claimingVoucherId,
    applyingVoucherCode,
    claimSuccessCode,
    onClaimVoucher,
    onUseVoucher,
    onExploreProducts,
}) => {
    const walletCodes = useMemo(() => new Set((myVouchers || []).map((voucher) => voucher.code)), [myVouchers]);

    if (loadingActive || loadingMine) {
        return <div className="py-16 text-center text-sm text-gray-500">Loading vouchers...</div>;
    }

    const discoverableVouchers = (activeVouchers || []).filter((voucher) => !walletCodes.has(voucher.code));

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-gray-300">Voucher Wallet</p>
                        <h3 className="mt-2 text-2xl font-bold">Collect now, apply later at checkout</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                            Save the vouchers you want, then pick them directly in checkout when your order meets the conditions.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs text-gray-300">Saved vouchers</p>
                            <p className="mt-1 text-2xl font-bold">{myVouchers.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs text-gray-300">Available to collect</p>
                            <p className="mt-1 text-2xl font-bold">{discoverableVouchers.length}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">My vouchers</h3>
                        <p className="text-sm text-gray-500">These are the vouchers you have already collected and can use at checkout.</p>
                    </div>
                </div>

                {myError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{myError}</div>}

                {myVouchers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                        <p className="text-sm text-gray-500">You have not collected any vouchers yet.</p>
                        <button
                            type="button"
                            onClick={onExploreProducts}
                            className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                            Start shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {myVouchers.map((voucher) => (
                            <VoucherCard
                                key={voucher._id || voucher.uuid || voucher.code}
                                voucher={voucher}
                                actionLabel={applyingVoucherCode === voucher.code ? "Preparing..." : "Use at checkout"}
                                actionDisabled={applyingVoucherCode === voucher.code}
                                actionTone="green"
                                helperText="This voucher is stored in your wallet and will be available on the checkout page."
                                onAction={() => onUseVoucher(voucher.code)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Collect more vouchers</h3>
                    <p className="text-sm text-gray-500">Claim promotions now so they are ready whenever you place an order.</p>
                </div>

                {activeError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{activeError}</div>}

                {discoverableVouchers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                        There are no new vouchers to collect right now.
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {discoverableVouchers.map((voucher) => {
                            const isClaiming = claimingVoucherId === (voucher._id || voucher.uuid);
                            const isClaimedFromActive = Boolean(voucher.isClaimed) || walletCodes.has(voucher.code);

                            return (
                                <VoucherCard
                                    key={voucher._id || voucher.uuid || voucher.code}
                                    voucher={voucher}
                                    actionLabel={
                                        isClaimedFromActive
                                            ? "Collected"
                                            : isClaiming
                                                ? "Collecting..."
                                                : claimSuccessCode === voucher.code
                                                    ? "Collected"
                                                    : "Collect voucher"
                                    }
                                    actionDisabled={isClaimedFromActive || isClaiming || claimSuccessCode === voucher.code}
                                    helperText="Claim once and keep it in your wallet until you use it."
                                    onAction={() => onClaimVoucher(voucher._id)}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default VouchersTab;
