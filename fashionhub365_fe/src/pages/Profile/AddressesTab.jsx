import React, { useEffect, useState } from "react";
import { Field, SearchableSelect } from "../Checkout/CheckoutCommon";

const VN_API = "https://provinces.open-api.vn/api";

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

const mapOptions = (items = []) => items.map((item) => ({ code: item.code, name: item.name }));

const AddressesTab = ({
    addresses,
    loading,
    error,
    submitting,
    onSave,
    onDelete,
    onSetDefault,
    onUseForCheckout,
}) => {
    const [editingUuid, setEditingUuid] = useState(null);
    const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
    const [localError, setLocalError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [provincesLoading, setProvincesLoading] = useState(false);
    const [districtsLoading, setDistrictsLoading] = useState(false);
    const [wardsLoading, setWardsLoading] = useState(false);

    useEffect(() => {
        if (!isFormOpen) {
            return undefined;
        }

        let active = true;
        setProvincesLoading(true);

        fetch(`${VN_API}/?depth=1`)
            .then((r) => r.json())
            .then((data) => {
                if (active) {
                    setProvinces(mapOptions(data));
                }
            })
            .catch(() => {
                if (active) {
                    setProvinces([]);
                }
            })
            .finally(() => {
                if (active) {
                    setProvincesLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [isFormOpen]);

    useEffect(() => {
        if (!isFormOpen || !form.city || provinces.length === 0) {
            if (!form.city) {
                setDistricts([]);
                setWards([]);
            }
            return;
        }

        const selectedProvince = provinces.find((item) => item.name === form.city);
        if (!selectedProvince?.code) {
            setDistricts([]);
            setWards([]);
            return;
        }

        let active = true;
        setDistrictsLoading(true);

        fetch(`${VN_API}/p/${selectedProvince.code}?depth=2`)
            .then((r) => r.json())
            .then((data) => {
                if (!active) {
                    return;
                }
                setDistricts(mapOptions(data.districts || []));
            })
            .catch(() => {
                if (active) {
                    setDistricts([]);
                }
            })
            .finally(() => {
                if (active) {
                    setDistrictsLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [isFormOpen, form.city, provinces]);

    useEffect(() => {
        if (!isFormOpen || !form.district || districts.length === 0) {
            if (!form.district) {
                setWards([]);
            }
            return;
        }

        const selectedDistrict = districts.find((item) => item.name === form.district);
        if (!selectedDistrict?.code) {
            setWards([]);
            return;
        }

        let active = true;
        setWardsLoading(true);

        fetch(`${VN_API}/d/${selectedDistrict.code}?depth=2`)
            .then((r) => r.json())
            .then((data) => {
                if (!active) {
                    return;
                }
                setWards(mapOptions(data.wards || []));
            })
            .catch(() => {
                if (active) {
                    setWards([]);
                }
            })
            .finally(() => {
                if (active) {
                    setWardsLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [isFormOpen, form.district, districts]);

    const resetForm = () => {
        setEditingUuid(null);
        setForm(EMPTY_ADDRESS_FORM);
        setDistricts([]);
        setWards([]);
        setLocalError("");
        setIsFormOpen(false);
    };

    const startCreate = () => {
        setEditingUuid(null);
        setForm(EMPTY_ADDRESS_FORM);
        setDistricts([]);
        setWards([]);
        setLocalError("");
        setIsFormOpen(true);
    };

    const startEdit = (address) => {
        setEditingUuid(address.uuid);
        setLocalError("");
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
        setIsFormOpen(true);
    };

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setLocalError("");
    };

    const handleCityChange = (selectedName) => {
        setForm((prev) => ({
            ...prev,
            city: selectedName,
            district: "",
            ward: "",
        }));
        setDistricts([]);
        setWards([]);
        setLocalError("");
    };

    const handleDistrictChange = (selectedName) => {
        setForm((prev) => ({
            ...prev,
            district: selectedName,
            ward: "",
        }));
        setWards([]);
        setLocalError("");
    };

    const handleWardChange = (selectedName) => {
        setForm((prev) => ({ ...prev, ward: selectedName }));
        setLocalError("");
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.phone || !form.line1 || !form.district || !form.city) {
            setLocalError("Please fill required fields.");
            return;
        }

        const ok = await onSave(form, editingUuid);
        if (ok) {
            resetForm();
        }
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
                            onClick={startCreate}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
                        >
                            + Add address
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                {loading && <div className="py-8 text-center text-sm text-gray-500">Loading addresses...</div>}
                {!loading && addresses.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                        No saved addresses yet. Click "Add address" to create one.
                    </div>
                )}
                {!loading && addresses.map((address) => (
                    <article key={address.uuid} className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-900">{address.full_name}</p>
                                    {address.is_default && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{address.phone}</p>
                                <p className="mt-1 text-sm text-gray-700">
                                    {[address.line1, address.line2, address.ward, address.district, address.city].filter(Boolean).join(", ")}
                                </p>
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

                        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
                            <Field
                                id="address_full_name"
                                label="Full name"
                                required
                                value={form.full_name}
                                onChange={(e) => updateField("full_name", e.target.value)}
                                placeholder="Nguyen Van A"
                            />
                            <Field
                                id="address_phone"
                                label="Phone"
                                required
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                placeholder="0912 345 678"
                            />
                            <div className="sm:col-span-2">
                                <Field
                                    id="address_line1"
                                    label="Specific address"
                                    required
                                    value={form.line1}
                                    onChange={(e) => updateField("line1", e.target.value)}
                                    placeholder="123 Le Loi Street"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Field
                                    id="address_line2"
                                    label="Address line 2"
                                    value={form.line2}
                                    onChange={(e) => updateField("line2", e.target.value)}
                                    placeholder="Apartment, building, landmark..."
                                />
                            </div>
                            <SearchableSelect
                                id="address_city"
                                label="Province / City"
                                required
                                placeholder="-- Select Province / City --"
                                options={provinces}
                                value={form.city}
                                onChange={handleCityChange}
                                loading={provincesLoading}
                            />
                            <SearchableSelect
                                id="address_district"
                                label="District"
                                required
                                placeholder={form.city ? "-- Select District --" : "-- Select Province First --"}
                                options={districts}
                                value={form.district}
                                onChange={handleDistrictChange}
                                loading={districtsLoading}
                                disabled={!form.city}
                            />
                            <SearchableSelect
                                id="address_ward"
                                label="Ward"
                                placeholder={form.district ? "-- Select Ward --" : "-- Select District First --"}
                                options={wards}
                                value={form.ward}
                                onChange={handleWardChange}
                                loading={wardsLoading}
                                disabled={!form.district}
                            />
                            <Field
                                id="address_note"
                                label="Note for courier"
                                value={form.note}
                                onChange={(e) => updateField("note", e.target.value)}
                                placeholder="Optional delivery note"
                            />
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={form.is_default}
                                    onChange={(e) => updateField("is_default", e.target.checked)}
                                />
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

export default AddressesTab;
