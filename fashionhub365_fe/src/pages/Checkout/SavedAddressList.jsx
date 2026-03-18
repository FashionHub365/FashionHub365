import React from "react";
import { useNavigate } from "react-router-dom";

export const SavedAddressList = ({ savedAddresses, loading, selectedAddressUuid, onSelect }) => {
    const navigate = useNavigate();

    return (
        <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Saved Addresses</p>
                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="text-xs font-semibold text-gray-700 underline"
                >
                    Manage Addresses
                </button>
            </div>

            {loading ? (
                <div className="py-2 text-xs text-gray-500">Loading addresses...</div>
            ) : savedAddresses.length === 0 ? (
                <div className="py-2 text-xs text-gray-500">No saved addresses. You can enter manually below.</div>
            ) : (
                <div className="space-y-2">
                    {savedAddresses.map((address) => (
                        <button
                            key={address.uuid}
                            type="button"
                            onClick={() => onSelect(address)}
                            className={`w-full rounded-sm border px-3 py-2 text-left transition ${selectedAddressUuid === address.uuid ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">{address.full_name}</p>
                                {address.is_default && (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">DEFAULT</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">{address.phone}</p>
                            <p className="mt-1 text-xs text-gray-600">
                                {[address.line1, address.line2, address.ward, address.district, address.city].filter(Boolean).join(", ")}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
