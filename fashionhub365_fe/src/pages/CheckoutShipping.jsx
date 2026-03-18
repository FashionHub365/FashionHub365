import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import addressApi from "../apis/addressApi";
import { StepBar } from "./Checkout/CheckoutCommon";
import { SavedAddressList } from "./Checkout/SavedAddressList";
import { AddressForm } from "./Checkout/AddressForm";
import { OrderSummary } from "./Checkout/OrderSummary";

// ── Vietnam address API (provinces.open-api.vn) ───────────────────────
const VN_API = "https://provinces.open-api.vn/api";
const CHECKOUT_SHIPPING_KEY = "checkout_shipping";

const shippingToForm = (shipping = {}, fallbackEmail = "") => ({
    fullName: shipping.full_name || shipping.fullName || "",
    phone: shipping.phone || "",
    email: shipping.email || fallbackEmail || "",
    province: shipping.province || shipping.city || "",
    district: shipping.district || "",
    ward: shipping.ward || "",
    addressLine: shipping.address_line || shipping.addressLine || shipping.line1 || "",
    note: shipping.note || "",
});

const savedAddressToForm = (address = {}, fallbackEmail = "") => ({
    fullName: address.full_name || "",
    phone: address.phone || "",
    email: fallbackEmail || "",
    province: address.city || "",
    district: address.district || "",
    ward: address.ward || "",
    addressLine: [address.line1, address.line2].filter(Boolean).join(", "),
    note: address.note || "",
});

const formToShipping = (form, selectedAddressUuid = "") => ({
    ...(selectedAddressUuid ? { uuid: selectedAddressUuid } : {}),
    full_name: form.fullName,
    phone: form.phone,
    email: form.email,
    province: form.province,
    district: form.district,
    ward: form.ward,
    address_line: form.addressLine,
    note: form.note,
});

// ── Main Component ────────────────────────────────────────────────────
export const CheckoutShipping = () => {
    const { cartData } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const userEmail = user?.email || "";

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
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);
    const [selectedAddressUuid, setSelectedAddressUuid] = useState("");

    // Fetch provinces on mount
    useEffect(() => {
        fetch(`${VN_API}/?depth=1`)
            .then((r) => r.json())
            .then((data) => setProvinces(data.map((p) => ({ code: p.code, name: p.name }))))
            .catch(() => setProvinces([]))
            .finally(() => setProvincesLoading(false));
    }, []);

    // Load from session storage or fallback email
    useEffect(() => {
        const savedShipping = sessionStorage.getItem(CHECKOUT_SHIPPING_KEY);
        if (savedShipping) {
            try {
                const parsed = JSON.parse(savedShipping);
                setForm((f) => ({
                    ...f,
                    ...shippingToForm(parsed, userEmail || f.email || ""),
                }));
                setSelectedAddressUuid(parsed?.uuid || "");
                return;
            } catch {
                sessionStorage.removeItem(CHECKOUT_SHIPPING_KEY);
            }
        }

        if (userEmail) {
            setForm((f) => ({ ...f, email: f.email || userEmail }));
        }
    }, [userEmail]);

    // Load saved user addresses
    useEffect(() => {
        let active = true;

        const run = async () => {
            if (!userEmail) {
                setSavedAddresses([]);
                return;
            }
            setSavedAddressesLoading(true);
            try {
                const res = await addressApi.getAddresses();
                const list = res?.data?.addresses || [];
                if (!active) return;
                setSavedAddresses(list);

                const hasSessionShipping = Boolean(sessionStorage.getItem(CHECKOUT_SHIPPING_KEY));
                if (!hasSessionShipping && list.length > 0) {
                    const preferred = list.find((a) => a.is_default) || list[0];
                    setForm((f) => ({
                        ...f,
                        ...savedAddressToForm(preferred, userEmail || f.email || ""),
                    }));
                    setSelectedAddressUuid(preferred.uuid || "");
                }
            } catch {
                if (active) setSavedAddresses([]);
            } finally {
                if (active) setSavedAddressesLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [userEmail]);

    // Ensure district/ward options are available for selected address
    useEffect(() => {
        if (!selectedAddressUuid || !form.province || provinces.length === 0 || districts.length > 0) return;
        const selectedProv = provinces.find((p) => p.name === form.province);
        if (!selectedProv?.code) return;

        let active = true;
        const run = async () => {
            setDistrictsLoading(true);
            setDistricts([]);
            setWards([]);
            try {
                const distRes = await fetch(`${VN_API}/p/${selectedProv.code}?depth=2`);
                const distData = await distRes.json();
                if (!active) return;
                const nextDistricts = (distData.districts || []).map((d) => ({ code: d.code, name: d.name }));
                setDistricts(nextDistricts);

                if (!form.district) return;
                const selectedDist = nextDistricts.find((d) => d.name === form.district);
                if (!selectedDist?.code) return;

                setWardsLoading(true);
                try {
                    const wardRes = await fetch(`${VN_API}/d/${selectedDist.code}?depth=2`);
                    const wardData = await wardRes.json();
                    if (!active) return;
                    setWards((wardData.wards || []).map((w) => ({ code: w.code, name: w.name })));
                } finally {
                    if (active) setWardsLoading(false);
                }
            } catch {
                if (active) { setDistricts([]); setWards([]); }
            } finally {
                if (active) setDistrictsLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [selectedAddressUuid, form.province, form.district, provinces]);

    const handleProvinceChange = async (selectedName) => {
        const selectedProv = provinces.find((p) => p.name === selectedName);

        setForm((f) => ({ ...f, province: selectedName, district: "", ward: "" }));
        setErrors((er) => ({ ...er, province: "", district: "", ward: "" }));
        setDistricts([]);
        setWards([]);
        setSelectedAddressUuid("");


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

    const handleDistrictChange = async (selectedName) => {
        const selectedDist = districts.find((d) => d.name === selectedName);

        setForm((f) => ({ ...f, district: selectedName, ward: "" }));
        setErrors((er) => ({ ...er, district: "", ward: "" }));
        setWards([]);
        setSelectedAddressUuid("");


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
        setSelectedAddressUuid("");
    };

    const applySavedAddress = (address) => {
        setForm((f) => ({
            ...f,
            ...savedAddressToForm(address, userEmail || f.email || ""),
        }));
        setErrors({});
        setSelectedAddressUuid(address.uuid || "");
    };

    const set = (key, val) => {
        setForm((f) => ({ ...f, [key]: val }));
        setErrors((e) => ({ ...e, [key]: "" }));
        setSelectedAddressUuid("");
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Please enter your full name";
        if (!form.phone.trim()) e.phone = "Please enter phone number";
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim()))
            e.phone = "Invalid phone number";
        if (!form.email.trim()) e.email = "Please enter your email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = "Invalid email";
        if (!form.province) e.province = "Please select province/city";
        if (!form.district) e.district = "Please select district";
        if (!form.ward) e.ward = "Please select ward";
        if (!form.addressLine.trim()) e.addressLine = "Please enter specific address";
        return e;
    };

    const handleContinue = () => {
        const e = validate();
        if (Object.keys(e).length > 0) {
            setErrors(e);
            return;
        }
        sessionStorage.setItem(CHECKOUT_SHIPPING_KEY, JSON.stringify(formToShipping(form, selectedAddressUuid)));
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>

                        {user && (
                            <SavedAddressList
                                savedAddresses={savedAddresses}
                                loading={savedAddressesLoading}
                                selectedAddressUuid={selectedAddressUuid}
                                onSelect={applySavedAddress}
                                onManageAddresses={() => navigate("/profile")}
                            />
                        )}

                        <AddressForm
                            form={form}
                            errors={errors}
                            provinces={provinces}
                            districts={districts}
                            wards={wards}
                            provincesLoading={provincesLoading}
                            districtsLoading={districtsLoading}
                            wardsLoading={wardsLoading}
                            onSet={set}
                            onProvinceChange={handleProvinceChange}
                            onDistrictChange={handleDistrictChange}
                            onWardChange={handleWardChange}
                        />

                        <button
                            onClick={handleContinue}
                            className="mt-8 w-full bg-black text-white py-4 font-semibold tracking-wider uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            Continue – Review Order
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>

                    {/* ───── Order Summary sidebar ───── */}
                    <OrderSummary
                        items={items}
                        totalItems={totalItems}
                        totalAmount={totalAmount}
                        shippingFee={shippingFee}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutShipping;
