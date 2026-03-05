import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

// ── Step indicator ────────────────────────────────────────────────────
const StepBar = ({ step }) => (
    <div className="flex items-center justify-center gap-0 mb-10">
        {["Cart", "Shipping", "Review & Pay"].map((label, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
                <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done ? "bg-black text-white" : active ? "bg-x-600 text-white" : "bg-gray-200 text-gray-400"}`}
                        >
                            {done ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : idx}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-x-600" : done ? "text-black" : "text-gray-400"}`}>
                            {label}
                        </span>
                    </div>
                    {i < 2 && (
                        <div className={`h-0.5 w-16 mx-1 mb-5 transition-all ${done ? "bg-black" : "bg-gray-200"}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ── Input component ───────────────────────────────────────────────────
const Field = ({ label, id, required, error, ...props }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            id={id}
            className={`w-full px-4 py-3 border text-sm font-text-200 outline-none transition-all
        ${error ? "border-red-400 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-x-600 focus:ring-1 focus:ring-x-600/20"}`}
            {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// ── Highlight matching text ───────────────────────────────────────────
const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 text-gray-900 font-semibold not-italic rounded-sm px-[1px]">{part}</mark>
                    : <span key={i}>{part}</span>
            )}
        </>
    );
};

// ── Searchable Dropdown component ─────────────────────────────────────
const SearchableSelect = ({ label, id, required, error, loading, disabled, options, value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    // Đóng khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus vào search khi mở
    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (optName) => {
        onChange(optName);
        setOpen(false);
        setSearch("");
    };

    const handleToggle = () => {
        if (disabled || loading) return;
        setOpen((prev) => !prev);
        if (!open) setSearch("");
    };

    return (
        <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {/* Trigger button */}
            <button
                id={id}
                type="button"
                onClick={handleToggle}
                disabled={disabled || loading}
                className={`w-full px-4 py-3 border text-sm text-left flex items-center justify-between gap-2 outline-none transition-all select-none
                    ${disabled || loading ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white cursor-pointer hover:border-gray-400"}
                    ${error ? "border-red-400 bg-red-50" : open ? "border-x-600 ring-1 ring-x-600/20" : "border-gray-300"}
                    ${!value ? "text-gray-400" : "text-gray-900"}`}
            >
                <span className="truncate flex-1">{value || placeholder}</span>
                <span className="flex-shrink-0">
                    {loading ? (
                        <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </span>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 shadow-2xl overflow-hidden"
                    style={{ minWidth: "100%" }}>

                    {/* Search box */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/80">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-sm focus-within:border-x-600 focus-within:ring-1 focus-within:ring-x-600/20 transition-all">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Tìm nhanh ${label.toLowerCase()}...`}
                                className="w-full text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filtered.length === 1) handleSelect(filtered[0].name);
                                    if (e.key === "Escape") { setOpen(false); setSearch(""); }
                                }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {search && (
                            <p className="text-[11px] text-gray-400 mt-1.5 px-1">
                                {filtered.length > 0 ? `${filtered.length} kết quả` : "Không tìm thấy"}
                            </p>
                        )}
                    </div>

                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto overscroll-contain">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-400 text-center">
                                <svg className="w-6 h-6 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Không tìm thấy kết quả
                            </li>
                        ) : (
                            filtered.map((opt) => (
                                <li
                                    key={opt.code}
                                    onClick={() => handleSelect(opt.name)}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 group
                                        ${value === opt.name
                                            ? "bg-x-600/8 text-x-600 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                    <span className="flex-1 truncate">
                                        {search ? <HighlightText text={opt.name} highlight={search} /> : opt.name}
                                    </span>
                                    {value === opt.name && (
                                        <svg className="w-4 h-4 text-x-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

// ── Vietnam address API (provinces.open-api.vn) ───────────────────────
const VN_API = "https://provinces.open-api.vn/api";

// ── Main Component ────────────────────────────────────────────────────
export const CheckoutShipping = () => {
    const { cartData } = useCart();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        province: "",
        district: "",
        ward: "",
        addressLine: "",
        note: "",
    });
    const [errors, setErrors] = useState({});

    // ── Address dropdown state ────────────────────────────────────────
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [provincesLoading, setProvincesLoading] = useState(true);
    const [districtsLoading, setDistrictsLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);


    // Fetch danh sách Tỉnh/Thành phố khi mount
    useEffect(() => {
        fetch(`${VN_API}/?depth=1`)
            .then((r) => r.json())
            .then((data) => setProvinces(data.map((p) => ({ code: p.code, name: p.name }))))
            .catch(() => setProvinces([]))
            .finally(() => setProvincesLoading(false));
    }, []);

    // Khi chọn Tỉnh → fetch Quận/Huyện
    const handleProvinceChange = async (selectedName) => {
        const selectedProv = provinces.find((p) => p.name === selectedName);

        setForm((f) => ({ ...f, province: selectedName, district: "", ward: "" }));
        setErrors((er) => ({ ...er, province: "", district: "", ward: "" }));
        setDistricts([]);
        setWards([]);


        if (!selectedProv?.code) return;
        setDistrictsLoading(true);
        try {
            const res = await fetch(`${VN_API}/p/${selectedProv.code}?depth=2`);
            const data = await res.json();
            setDistricts((data.districts || []).map((d) => ({ code: d.code, name: d.name })));
        } catch {
            setDistricts([]);
        } finally {
            setDistrictsLoading(false);
        }
    };

    // Khi chọn Quận → fetch Phường/Xã
    const handleDistrictChange = async (selectedName) => {
        const selectedDist = districts.find((d) => d.name === selectedName);

        setForm((f) => ({ ...f, district: selectedName, ward: "" }));
        setErrors((er) => ({ ...er, district: "", ward: "" }));
        setWards([]);


        if (!selectedDist?.code) return;
        setWardsLoading(true);
        try {
            const res = await fetch(`${VN_API}/d/${selectedDist.code}?depth=2`);
            const data = await res.json();
            setWards((data.wards || []).map((w) => ({ code: w.code, name: w.name })));
        } catch {
            setWards([]);
        } finally {
            setWardsLoading(false);
        }
    };

    const handleWardChange = (selectedName) => {
        setForm((f) => ({ ...f, ward: selectedName }));
        setErrors((er) => ({ ...er, ward: "" }));
    };

    const set = (key, val) => {
        setForm((f) => ({ ...f, [key]: val }));
        setErrors((e) => ({ ...e, [key]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
        if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim()))
            e.phone = "Số điện thoại không hợp lệ";
        if (!form.email.trim()) e.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = "Email không hợp lệ";
        if (!form.province) e.province = "Vui lòng chọn tỉnh/thành phố";
        if (!form.district) e.district = "Vui lòng chọn quận/huyện";
        if (!form.ward) e.ward = "Vui lòng chọn phường/xã";
        if (!form.addressLine.trim()) e.addressLine = "Vui lòng nhập địa chỉ cụ thể";
        return e;
    };

    const handleContinue = () => {
        const e = validate();
        if (Object.keys(e).length > 0) {
            setErrors(e);
            return;
        }
        sessionStorage.setItem(
            "checkout_shipping",
            JSON.stringify({
                full_name: form.fullName,
                phone: form.phone,
                email: form.email,
                province: form.province,
                district: form.district,
                ward: form.ward,
                address_line: form.addressLine,
                note: form.note,
            })
        );
        navigate("/checkout/review");
    };

    const { items = [], totalItems = 0, totalAmount = 0 } = cartData;
    const shippingFee = totalAmount >= 1000000 ? 0 : 30000;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/textures/landingpage/vector-3.png" alt="FashionHub365" className="h-7 object-contain" />
                    </Link>
                    <span className="text-sm text-gray-500 hidden md:block">Checkout</span>
                    <Link to="/listing" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        ← Continue Shopping
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <StepBar step={2} />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                    {/* ───── Form ───── */}
                    <div className="bg-white border border-gray-200 p-8 h-fit">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin giao hàng</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <Field
                                    id="fullName" label="Họ và tên" required
                                    placeholder="Nguyễn Văn A"
                                    value={form.fullName} onChange={e => set("fullName", e.target.value)}
                                    error={errors.fullName}
                                />
                            </div>
                            <Field
                                id="phone" label="Số điện thoại" required type="tel"
                                placeholder="0912 345 678"
                                value={form.phone} onChange={e => set("phone", e.target.value)}
                                error={errors.phone}
                            />
                            <Field
                                id="email" label="Email" required type="email"
                                placeholder="email@example.com"
                                value={form.email} onChange={e => set("email", e.target.value)}
                                error={errors.email}
                            />

                            {/* ── Tỉnh / Thành phố ── */}
                            <SearchableSelect
                                id="province"
                                label="Tỉnh / Thành phố"
                                required
                                placeholder="-- Chọn Tỉnh / Thành phố --"
                                options={provinces}
                                value={form.province}
                                onChange={handleProvinceChange}
                                loading={provincesLoading}
                                error={errors.province}
                            />

                            {/* ── Quận / Huyện ── */}
                            <SearchableSelect
                                id="district"
                                label="Quận / Huyện"
                                required
                                placeholder={form.province ? "-- Chọn Quận / Huyện --" : "-- Chọn Tỉnh trước --"}
                                options={districts}
                                value={form.district}
                                onChange={handleDistrictChange}
                                loading={districtsLoading}
                                disabled={!form.province}
                                error={errors.district}
                            />

                            {/* ── Phường / Xã ── */}
                            <SearchableSelect
                                id="ward"
                                label="Phường / Xã"
                                required
                                placeholder={form.district ? "-- Chọn Phường / Xã --" : "-- Chọn Quận trước --"}
                                options={wards}
                                value={form.ward}
                                onChange={handleWardChange}
                                loading={wardsLoading}
                                disabled={!form.district}
                                error={errors.ward}
                            />

                            <div className="md:col-span-2">
                                <Field
                                    id="addressLine" label="Địa chỉ cụ thể (số nhà, tên đường)" required
                                    placeholder="123 Đường Lê Lợi"
                                    value={form.addressLine} onChange={e => set("addressLine", e.target.value)}
                                    error={errors.addressLine}
                                />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label htmlFor="note" className="text-sm font-medium text-gray-700">Ghi chú đơn hàng</label>
                                <textarea
                                    id="note"
                                    rows={3}
                                    placeholder="Ghi chú cho người giao hàng (không bắt buộc)..."
                                    value={form.note}
                                    onChange={e => set("note", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:border-x-600 focus:ring-1 focus:ring-x-600/20 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="mt-8 w-full bg-black text-white py-4 font-semibold tracking-wider uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            Tiếp tục – Xem lại đơn hàng
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>

                    {/* ───── Order Summary sidebar ───── */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Đơn hàng ({totalItems} sản phẩm)</h3>

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
                                    <span>Tạm tính</span>
                                    <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span>{shippingFee === 0 ? <span className="text-green-600 font-medium">Miễn phí</span> : `${shippingFee.toLocaleString("vi-VN")}₫`}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                                    <span>Tổng cộng</span>
                                    <span>{(totalAmount + shippingFee).toLocaleString("vi-VN")}₫</span>
                                </div>
                            </div>
                        </div>

                        {/* Trust badges */}
                        <div className="bg-white border border-gray-200 p-4">
                            {[
                                { icon: "🔒", text: "Thanh toán an toàn & bảo mật" },
                                { icon: "↩️", text: "Đổi trả trong vòng 30 ngày" },
                                { icon: "📦", text: "Giao hàng nhanh 2-5 ngày" },
                            ].map((b) => (
                                <div key={b.text} className="flex items-center gap-2 py-1.5">
                                    <span className="text-base">{b.icon}</span>
                                    <span className="text-xs text-gray-600">{b.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutShipping;
