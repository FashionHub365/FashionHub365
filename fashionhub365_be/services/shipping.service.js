const { ShippingZone, ShippingRate, ShippingProvider } = require('../models');

/**
 * Calculate shipping fee based on address and weight
 * @param {Object} address - Shipping address object
 * @param {number} totalWeight - Total weight in grams/kg (logic to be refined)
 * @returns {Promise<number>}
 */
const calculateShippingFee = async (address, totalWeight = 0) => {
    const province = address.province || '';

    // 1. Find matching zone by name (simplification: one province = one zone or zone name contains province)
    let zone = await ShippingZone.findOne({ name: { $regex: province, $options: 'i' } });

    // Fallback to a "Default" or "Standard" zone if no specific province zone found
    if (!zone) {
        zone = await ShippingZone.findOne({ name: /default|standard/i });
    }

    if (!zone) {
        return 30000; // Final hardcoded fallback if DB is empty
    }

    // 2. Find rate for this zone (pick first available provider for now)
    const rate = await ShippingRate.findOne({ zone_id: zone._id }).sort({ base_fee: 1 });

    if (!rate) {
        return 30000;
    }

    // 3. Calculation logic: base_fee + (extra weight * per_kg_fee)
    // Assuming base_fee covers up to 1kg (1000g)
    let fee = rate.base_fee || 30000;

    if (totalWeight > 1 && rate.per_kg_fee) {
        fee += (totalWeight - 1) * rate.per_kg_fee;
    }

    return fee;
};

module.exports = {
    calculateShippingFee,
};
