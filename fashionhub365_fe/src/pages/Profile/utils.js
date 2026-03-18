/**
 * Utility functions for the Profile module
 */

/**
 * Maps a profile address object to a checkout shipping object format
 * used by CheckoutShipping.jsx
 * 
 * @param {Object} address - The address object from profile
 * @param {string} email - Fallback email from user profile
 * @returns {Object} - Flattened shipping object for session storage
 */
export const toCheckoutShipping = (address, email = "") => {
    if (!address) return null;

    return {
        uuid: address.uuid || address._id || "",
        full_name: address.full_name || address.fullName || "",
        phone: address.phone || "",
        email: email || address.email || "",
        province: address.province || address.city || "",
        district: address.district || "",
        ward: address.ward || "",
        address_line: address.address_line || [address.line1, address.line2].filter(Boolean).join(", ") || "",
        note: address.note || ""
    };
};
