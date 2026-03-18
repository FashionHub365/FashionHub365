import React from "react";
import { Field, SearchableSelect } from "./CheckoutCommon";

export const AddressForm = ({
    form,
    errors,
    provinces,
    districts,
    wards,
    provincesLoading,
    districtsLoading,
    wardsLoading,
    onSet,
    onProvinceChange,
    onDistrictChange,
    onWardChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
                <Field
                    id="fullName" label="Full Name" required
                    placeholder="Nguyen Van A"
                    value={form.fullName} onChange={e => onSet("fullName", e.target.value)}
                    error={errors.fullName}
                />
            </div>
            <Field
                id="phone" label="Phone Number" required type="tel"
                placeholder="0912 345 678"
                value={form.phone} onChange={e => onSet("phone", e.target.value)}
                error={errors.phone}
            />
            <Field
                id="email" label="Email" required type="email"
                placeholder="email@example.com"
                value={form.email} onChange={e => onSet("email", e.target.value)}
                error={errors.email}
            />

            <SearchableSelect
                id="province"
                label="Province / City"
                required
                placeholder="-- Select Province / City --"
                options={provinces}
                value={form.province}
                onChange={onProvinceChange}
                loading={provincesLoading}
                error={errors.province}
            />

            <SearchableSelect
                id="district"
                label="District"
                required
                placeholder={form.province ? "-- Select District --" : "-- Select Province First --"}
                options={districts}
                value={form.district}
                onChange={onDistrictChange}
                loading={districtsLoading}
                disabled={!form.province}
                error={errors.district}
            />

            <SearchableSelect
                id="ward"
                label="Ward"
                required
                placeholder={form.district ? "-- Select Ward --" : "-- Select District First --"}
                options={wards}
                value={form.ward}
                onChange={onWardChange}
                loading={wardsLoading}
                disabled={!form.district}
                error={errors.ward}
            />

            <div className="md:col-span-2">
                <Field
                    id="addressLine" label="Specific Address" required
                    placeholder="123 Le Loi Street"
                    value={form.addressLine} onChange={e => onSet("addressLine", e.target.value)}
                    error={errors.addressLine}
                />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="note" className="text-sm font-medium text-gray-700">Order Notes</label>
                <textarea
                    id="note"
                    rows={3}
                    placeholder="Notes for the courier (optional)..."
                    value={form.note}
                    onChange={e => onSet("note", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:border-x-600 focus:ring-1 focus:ring-x-600/20 outline-none resize-none"
                />
            </div>
        </div>
    );
};
