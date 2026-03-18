const { calculateShippingFee } = require('./services/shipping.service');
const mongoose = require('mongoose');

// Mock a simple test run
const testShipping = async () => {
    console.log('--- Testing Shipping Fee Calculation ---');
    const address = { province: 'Hà Nội' };
    const fee = await calculateShippingFee(address);
    console.log(`Address: ${address.province}, Fee: ${fee} VND`);

    const address2 = { province: 'HCM' };
    const fee2 = await calculateShippingFee(address2);
    console.log(`Address: ${address2.province}, Fee: ${fee2} VND`);
    console.log('--- Test Completed ---');
};

if (require.main === module) {
    testShipping().catch(console.error);
}
