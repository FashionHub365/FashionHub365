import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import checkoutApi from "../apis/checkoutApi";
import voucherApi from "../apis/voucherApi";
import { isPrivilegedCommerceUser } from "../utils/roleUtils";

// ── Step indicator ──────────────────────────────────────────────────
const StepBar = ({ step }) => (
    <div className="flex items-center justify-center gap-0 mb-10">
        {["Cart", "Shipping", "Review & Pay"].map((label, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
                <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done ? "bg-black text-white" : active ? "bg-black text-white" : "bg-gray-200 text-gray-400"} `}>
                            {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> : idx}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-black" : done ? "text-black" : "text-gray-400"} `}>{label}</span>
                    </div>
                    {i < 2 && <div className={`h-0.5 w-16 mx-1 mb-5 transition-all ${done ? "bg-black" : "bg-gray-200"} `} />}
                </React.Fragment>
            );
        })}
    </div>
);

// ── Payment method card ─────────────────────────────────────────────
const PaymentCard = ({ id, selected, onSelect, icon, title, description }) => (
    <label
        htmlFor={id}
        className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all rounded-sm
      ${selected ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"} `}
    >
        <input type="radio" id={id} name="payment_method" value={id} checked={selected} onChange={() => onSelect(id)} className="mt-1 accent-black" />
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div>
            <p className="font-semibold text-sm text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
    </label>
);

// ── Order Item Row ──────────────────────────────────────────────────
const OrderItemRow = ({ item }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="relative flex-shrink-0">
            <img
                src={item.image || "/textures/cartpage/image.jpg"}
                alt={item.name}
                className="w-14 h-18 object-cover"
                style={{ height: "72px" }}
            />
            <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {item.quantity}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
            <p className="text-xs text-gray-500">{item.variantName}</p>
        </div>
        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
            {(item.price * item.quantity).toLocaleString("vi-VN")}₫
        </div>
    </div>
);

// ── Main Component ──────────────────────────────────────────────────
export const CheckoutReview = () => {
    const { cartData, fetchCart } = useCart();
    const { user } = useAuth();
    const isBlockedBuyer = isPrivilegedCommerceUser(user);
    const navigate = useNavigate();
    const location = useLocation();

    const [shipping, setShipping] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bankTransferPayments, setBankTransferPayments] = useState([]);
    const [createdOrderUuids, setCreatedOrderUuids] = useState([]);
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [walletVouchers, setWalletVouchers] = useState([]);
    const [checkoutQuote, setCheckoutQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const { items = [], totalItems = 0, totalAmount = 0 } = cartData;

    const getVoucherDiscount = (voucher, amount) => {
        if (!voucher) return 0;

        if (typeof voucher._discountAmount === "number") {
            return voucher._discountAmount;
        }

        const rawDiscount = voucher.discount_type === 'percent'
            ? (amount * voucher.discount_value / 100)
            : voucher.discount_value;

        const cappedDiscount = voucher.discount_type === 'percent' && voucher.max_discount
            ? Math.min(rawDiscount, voucher.max_discount)
            : rawDiscount;

        return Math.min(cappedDiscount, amount);
    };

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const [activeRes, myRes] = await Promise.allSettled([
                    voucherApi.getActiveVouchers({ status: 'active', limit: 50 }),
                    voucherApi.getMyVouchers(),
                ]);

                if (activeRes.status === "fulfilled" && activeRes.value.success) {
                    const items = activeRes.value.data?.items || activeRes.value.data || activeRes.value.items || [];
                    setAvailableVouchers(Array.isArray(items) ? items : []);
                }

                if (myRes.status === "fulfilled" && myRes.value.success) {
                    const items = myRes.value.data || myRes.value.data?.items || [];
                    setWalletVouchers(Array.isArray(items) ? items : []);
                }
            } catch (err) {
                console.error("Failed to fetch vouchers", err);
            }
        };
        fetchVouchers();
    }, []);

    useEffect(() => {
        if (isBlockedBuyer) {
            navigate("/", { replace: true });
            return;
        }
        const saved = sessionStorage.getItem("checkout_shipping");
        if (!saved) {
            navigate("/checkout");
            return;
        }
        setShipping(JSON.parse(saved));
    }, [isBlockedBuyer, navigate]);

    useEffect(() => {
        let active = true;

        const run = async () => {
            if (!shipping || !items.length) {
                setCheckoutQuote(null);
                setQuoteLoading(false);
                return;
            }

            setQuoteLoading(true);
            try {
                const res = await checkoutApi.quoteOrder({
                    shipping_address: shipping,
                });

                if (!active) return;
                setCheckoutQuote(res?.data || null);
            } catch (error) {
                if (!active) return;
                setCheckoutQuote(null);
            } finally {
                if (active) setQuoteLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [shipping, items.length]);

    useEffect(() => {
        const preselectedVoucherCode = location.state?.voucherCode;
        if (preselectedVoucherCode) {
            setVoucherCode(preselectedVoucherCode);
        }
    }, [location.state]);

    const subtotal = checkoutQuote?.subtotal ?? totalAmount;
    const shippingFee = checkoutQuote?.shippingFee ?? 0;

    const finalDiscount = getVoucherDiscount(appliedVoucher, subtotal);

    const grandTotal = Math.max(0, subtotal + shippingFee - finalDiscount);
    const uniqueStoreCount = new Set(items.map((item) => item.storeId).filter(Boolean)).size;
    const isVnPayBlockedByMultiStore = paymentMethod === "vnpay" && uniqueStoreCount > 1;

    const handleApplyVoucher = async (codeOverride) => {
        const code = typeof codeOverride === 'string' ? codeOverride : voucherCode;
        if (!code.trim()) return;
        setVoucherLoading(true);
        setVoucherError("");
        try {
            const res = await voucherApi.applyVoucher(code, subtotal);
            if (res.success || res.data?.success) {
                const payload = res.data?.data || res.data || res;
                const voucher = payload?.voucher || res.voucher;
                setAppliedVoucher(voucher ? { ...voucher, _discountAmount: payload?.discount } : null);
                setVoucherCode(code);
                setVoucherError("");
            }
        } catch (err) {
            setAppliedVoucher(null);
            setVoucherError(err.response?.data?.message || err.message || "Invalid voucher code");
        } finally {
            setVoucherLoading(false);
        }
    };

    useEffect(() => {
        const preselectedVoucherCode = location.state?.voucherCode;
        if (preselectedVoucherCode && subtotal > 0 && !appliedVoucher && !voucherLoading) {
            const applyPreselectedVoucher = async () => {
                setVoucherLoading(true);
                setVoucherError("");
                try {
                    const res = await voucherApi.applyVoucher(preselectedVoucherCode, subtotal);
                    if (res.success || res.data?.success) {
                        const payload = res.data?.data || res.data || res;
                        const voucher = payload?.voucher || res.voucher;
                        setAppliedVoucher(voucher ? { ...voucher, _discountAmount: payload?.discount } : null);
                        setVoucherCode(preselectedVoucherCode);
                    }
                } catch (err) {
                    setAppliedVoucher(null);
                    setVoucherError(err.response?.data?.message || err.message || "Invalid voucher code");
                } finally {
                    setVoucherLoading(false);
                }
            };

            applyPreselectedVoucher();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate, subtotal, appliedVoucher, voucherLoading]);

    const handlePlaceOrder = async () => {
        if (!shipping) return;
        if (isVnPayBlockedByMultiStore) {
            setError("VNPAY currently supports one-store checkout only. Please checkout items by store.");
            return;
        }
        setPlacing(true);
        setError("");

        try {
            const orderRes = await checkoutApi.placeOrder({
                shipping_address: shipping,
                payment_method: paymentMethod,
                note: shipping.note || "",
                voucher_code: appliedVoucher?.code || undefined,
                returnUrl: paymentMethod === "vnpay" ? `${window.location.origin}/payment-result` : undefined,
            });
            const createdOrders = orderRes?.data?.orders || [];
            const orderUuids = createdOrders.map((order) => order?.uuid).filter(Boolean);

            if (paymentMethod === "vnpay") {
                const paymentUrl = orderRes?.data?.payment?.paymentUrl;
                if (!paymentUrl) {
                    throw new Error("VNPAY payment URL is missing.");
                }

                sessionStorage.removeItem("checkout_shipping");
                await fetchCart();
                window.location.assign(paymentUrl);
                return;
            }

            if (paymentMethod === "bank_transfer") {
                if (createdOrders.length === 0) {
                    throw new Error("Unable to initialize bank transfer payment.");
                }

                const payments = Array.isArray(orderRes?.data?.payments) ? orderRes.data.payments : [];
                if (payments.length !== createdOrders.length) {
                    throw new Error("Failed to create bank transfer payments.");
                }

                setCreatedOrderUuids(orderUuids);
                setBankTransferPayments(payments);
                sessionStorage.removeItem("checkout_shipping");
                await fetchCart();
                setSuccess(true);
                return;
            }

            // Success!
            setCreatedOrderUuids(orderUuids);
            setBankTransferPayments([]);
            sessionStorage.removeItem("checkout_shipping");
            await fetchCart(); // Refresh giỏ hàng (đã bị xoá phía BE)
            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.";
            setError(msg);
        } finally {
            setPlacing(false);
        }
    };

    // ── Success Screen ──
    if (success) {
        const totalBankTransferAmount = bankTransferPayments.reduce(
            (sum, payment) => sum + Number(payment?.amount || 0),
            0
        );
        const bankInfo = bankTransferPayments[0]?.bankInfo;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <div className="bg-white border border-gray-200 p-12 max-w-xl w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {bankTransferPayments.length > 0 ? "Order created, waiting for payment" : "Order placed successfully"}
                    </h2>
                    <p className="text-gray-500 mb-2">Thank you for shopping at FashionHub365.</p>
                    <p className="text-gray-400 text-sm mb-4">
                        {bankTransferPayments.length > 0
                            ? "Please transfer with the correct content below so we can confirm your order."
                            : <>Your order is being processed. A confirmation email will be sent to <strong>{shipping?.email}</strong>.</>
                        }
                    </p>

                    {bankTransferPayments.length > 0 && (
                        <div className="text-left text-sm border border-blue-200 bg-blue-50 p-4 rounded-sm mb-6">
                            <p className="font-semibold text-blue-800 mb-1">
                                Total transfer amount: {totalBankTransferAmount.toLocaleString("vi-VN")} VND
                            </p>
                            {bankInfo && (
                                <>
                                    <p>Bank: <strong>{bankInfo.bank_name}</strong></p>
                                    <p>Account name: <strong>{bankInfo.account_name}</strong></p>
                                    <p>Account number: <strong>{bankInfo.account_number}</strong></p>
                                </>
                            )}
                            <div className="mt-2 space-y-1">
                                {bankTransferPayments.map((payment, idx) => (
                                    <p key={payment.transactionId || idx} className="break-all">
                                        Order <strong>#{createdOrderUuids[idx]?.slice(0, 8)?.toUpperCase() || idx + 1}</strong>: {" "}
                                        <span className="font-semibold">{Number(payment.amount || 0).toLocaleString("vi-VN")} VND</span>{" "}
                                        - Content: <strong>{payment.transferContent}</strong>
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-6">
                        Shipping address: <br />
                        <strong>{shipping?.full_name}</strong> - {shipping?.phone}<br />
                        {shipping?.address_line}, {shipping?.ward}, {shipping?.district}, {shipping?.province}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate("/profile")}
                            className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition-colors"
                        >
                            View my orders
                        </button>
                        <button
                            onClick={() => navigate("/listing")}
                            className="w-full border border-gray-300 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                            Continue shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isBlockedBuyer || !shipping) return null;

    const walletVoucherCodes = new Set(walletVouchers.map((voucher) => voucher.code));
    const displayVouchers = walletVouchers.length > 0 ? walletVouchers : availableVouchers;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/textures/landingpage/vector-3.png" alt="FashionHub365" className="h-7 object-contain" />
                    </Link>
                    <span className="text-sm text-gray-500 hidden md:block">Checkout</span>
                    <button onClick={() => navigate("/checkout")} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        ← Edit Shipping Information
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <StepBar step={3} />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                    {/* ───── Left column ───── */}
                    <div className="flex flex-col gap-6">
                        {/* Shipping info summary */}
                        <div className="bg-white border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                                <button onClick={() => navigate("/checkout")} className="text-xs text-gray-500 hover:text-black underline underline-offset-2">
                                    Edit
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-sm p-4 text-sm text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900">{shipping.full_name} – {shipping.phone}</p>
                                <p className="mt-0.5">{shipping.email}</p>
                                <p className="mt-1">{shipping.address_line}, {shipping.ward}, {shipping.district}, {shipping.province}</p>
                                {shipping.note && <p className="mt-1 italic text-gray-500">Note: {shipping.note}</p>}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                            <div className="flex flex-col gap-3">
                                <PaymentCard
                                    id="cod"
                                    selected={paymentMethod === "cod"}
                                    onSelect={setPaymentMethod}
                                    icon="💵"
                                    title="Cash on Delivery (COD)"
                                    description="Pay cash to the delivery person upon receiving the order"
                                />
                                <PaymentCard
                                    id="bank_transfer"
                                    selected={paymentMethod === "bank_transfer"}
                                    onSelect={setPaymentMethod}
                                    icon="🏦"
                                    title="Bank Transfer"
                                    description="Transfer directly to our bank account"
                                />
                                <PaymentCard
                                    id="vnpay"
                                    selected={paymentMethod === "vnpay"}
                                    onSelect={setPaymentMethod}
                                    icon="📱"
                                    title="VNPay"
                                    description="Pay via VNPay gateway"
                                />
                            </div>

                            {paymentMethod === "bank_transfer" && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 rounded-sm">
                                    <p className="font-semibold mb-1">Bank Transfer Information</p>
                                    <p>Bank: <strong>Vietcombank</strong></p>
                                    <p>Account Number: <strong>1234 5678 9012</strong></p>
                                    <p>Account Name: <strong>FASHIONHUB365 JSC</strong></p>
                                    <p className="mt-1 text-blue-600 text-xs">Transfer content: Your name + phone number</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm button */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded-sm">
                                {error}
                            </div>
                        )}
                        {isVnPayBlockedByMultiStore && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm rounded-sm">
                                VNPAY currently supports one-store checkout only. Please split your cart by store.
                            </div>
                        )}

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placing || items.length === 0 || isVnPayBlockedByMultiStore}
                            className={`w-full py-4 font-bold tracking-wider uppercase text-white transition-all flex items-center justify-center gap-2
                ${placing || items.length === 0 || isVnPayBlockedByMultiStore ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
                        >
                            {placing ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing order...
                                </>
                            ) : (
                                <>
                                    🛍️ Place Order – {grandTotal.toLocaleString("vi-VN")}₫
                                </>
                            )}
                        </button>
                    </div>

                    {/* ───── Right: Order summary ───── */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Your Order</h3>

                            <div className="max-h-80 overflow-y-auto">
                                {items.map((item) => <OrderItemRow key={item.itemId} item={item} />)}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2.5">
                                {/* Voucher Section */}
                                <div className="mb-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter voucher code"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                            className="flex-1 border border-gray-300 px-3 py-2 text-sm uppercase"
                                            disabled={appliedVoucher || voucherLoading}
                                        />
                                        <button
                                            onClick={appliedVoucher ? () => { setAppliedVoucher(null); setVoucherCode(""); } : () => handleApplyVoucher()}
                                            disabled={voucherLoading || (!voucherCode.trim() && !appliedVoucher)}
                                            className={`px-4 py-2 text-sm font-semibold text-white transition-colors ${appliedVoucher ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800 disabled:bg-gray-400'}`}
                                        >
                                            {voucherLoading ? 'Wait...' : appliedVoucher ? 'Remove' : 'Apply'}
                                        </button>
                                    </div>
                                    {voucherError && <p className="text-red-500 text-xs mt-1">{voucherError}</p>}
                                    {appliedVoucher && (
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-green-600 text-xs font-medium">Voucher applied: {finalDiscount.toLocaleString("vi-VN")}₫ off</p>
                                            <button
                                                onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                            >
                                                [ Xóa voucher ]
                                            </button>
                                        </div>
                                    )}

                                    {/* Available Vouchers */}
                                    {!appliedVoucher && displayVouchers.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                    {walletVouchers.length > 0 ? "My Voucher Wallet" : "Available Vouchers"}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate("/profile", { state: { tab: "vouchers" } })}
                                                    className="text-[11px] font-semibold text-gray-600 underline"
                                                >
                                                    View voucher wallet
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {displayVouchers.map(v => {
                                                    const minOrderAmount = v.min_order_amount || v.min_order_value || 0;
                                                    const isEligible = subtotal >= minOrderAmount;
                                                    return (
                                                        <div key={v._id} className={`flex justify-between items-center p-3 border rounded-lg transition-all ${isEligible ? 'bg-white border-blue-200 hover:border-blue-400' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm text-gray-900 border border-dashed border-gray-400 px-1.5 py-0.5 rounded bg-gray-50">{v.code}</span>
                                                                    <span className="text-xs font-semibold text-blue-600">
                                                                        {v.discount_type === 'percent' ? `${v.discount_value}% OFF` : `${(v.discount_value || 0).toLocaleString('vi-VN')}₫ OFF`}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.description}</p>
                                                                <p className={`text-[10px] mt-1 font-medium ${isEligible ? 'text-gray-400' : 'text-red-500'}`}>
                                                                    Min. order: {minOrderAmount.toLocaleString('vi-VN')}₫
                                                                </p>
                                                                {walletVoucherCodes.has(v.code) && (
                                                                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                                        Saved in wallet
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleApplyVoucher(v.code)}
                                                                disabled={!isEligible || voucherLoading}
                                                                className={`px-3 py-1.5 ml-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${isEligible ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                            >
                                                                Apply
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-200 pt-3">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping Fee</span>
                                    <span>
                                        {quoteLoading
                                            ? 'Calculating...'
                                            : shippingFee === 0
                                            ? <span className="text-green-600 font-semibold">Free</span>
                                            : `${shippingFee.toLocaleString("vi-VN")}₫`
                                        }
                                    </span>
                                </div>
                                {appliedVoucher && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Voucher Discount</span>
                                        <span>-{finalDiscount.toLocaleString("vi-VN")}₫</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="font-bold text-gray-900">Total Payment</span>
                                    <span className="font-bold text-xl text-gray-900">{grandTotal.toLocaleString("vi-VN")}₫</span>
                                </div>
                            </div>
                        </div>

                        {/* Security + policy */}
                        <div className="bg-white border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-700">Security Commitment</span>
                            </div>
                            {[
                                "256-bit SSL encrypted information",
                                "Payment information is not stored",
                                "Protected by 100% refund policy",
                            ].map((t) => (
                                <div key={t} className="flex items-start gap-2 py-1">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span className="text-xs text-gray-600">{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutReview;
