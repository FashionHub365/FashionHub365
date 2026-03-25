require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ShippingProvider, ShippingZone, ShippingRate } = require('../models');

const SHIPPING_PROVIDER = {
    name: 'FashionHub Express',
    website: 'https://fashionhub365.local/shipping',
    contact_phone: '1900 365 365',
    contact_email: 'shipping@fashionhub365.local',
};

const SHIPPING_ZONES = [
    {
        name: 'Hà Nội',
        description: 'Shipping zone for Hà Nội',
        rate: { base_fee: 20000, per_kg_fee: 5000, eta_days: 1 },
    },
    {
        name: 'TP. Hồ Chí Minh',
        description: 'Shipping zone for TP. Hồ Chí Minh',
        rate: { base_fee: 25000, per_kg_fee: 5000, eta_days: 2 },
    },
    {
        name: 'Đà Nẵng',
        description: 'Shipping zone for Đà Nẵng',
        rate: { base_fee: 28000, per_kg_fee: 6000, eta_days: 2 },
    },
    {
        name: 'default',
        description: 'Fallback shipping zone for all other provinces',
        rate: { base_fee: 30000, per_kg_fee: 7000, eta_days: 3 },
    },
];

const seedShipping = async () => {
    console.log('Seeding shipping data...');

    const provider = await ShippingProvider.findOneAndUpdate(
        { name: SHIPPING_PROVIDER.name },
        { $set: SHIPPING_PROVIDER },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const zoneData of SHIPPING_ZONES) {
        const zone = await ShippingZone.findOneAndUpdate(
            { name: zoneData.name },
            {
                $set: {
                    name: zoneData.name,
                    description: zoneData.description,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await ShippingRate.findOneAndUpdate(
            { provider_id: provider._id, zone_id: zone._id },
            {
                $set: {
                    provider_id: provider._id,
                    zone_id: zone._id,
                    min_weight: 0,
                    max_weight: 1,
                    base_fee: zoneData.rate.base_fee,
                    per_kg_fee: zoneData.rate.per_kg_fee,
                    eta_days: zoneData.rate.eta_days,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`- Upserted zone "${zoneData.name}" with base fee ${zoneData.rate.base_fee.toLocaleString('vi-VN')} VND`);
    }

    console.log('Shipping seed completed.');
};

const run = async () => {
    try {
        await connectDB();
        await seedShipping();
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed shipping data:', error);
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // ignore disconnect errors on failure path
        }
        process.exit(1);
    }
};

run();
