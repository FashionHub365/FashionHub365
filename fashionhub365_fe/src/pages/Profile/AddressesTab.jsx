import React, { useState } from "react";

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

export default AddressesTab;
