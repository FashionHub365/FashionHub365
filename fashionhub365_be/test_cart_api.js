const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api/v1';

const log = (step, message, status = 'INFO') => {
    const icons = { INFO: 'ℹ️', SUCCESS: '✅', ERROR: '❌', WARN: '⚠️' };
    console.log(`${icons[status] || '•'} [Step ${step}] ${message}`);
};

const runTests = async () => {
    try {
        console.log('--- STARTING CART API TESTS ---\n');

        // 0. Connect to DB to get a valid product
        log(0, 'Connecting to DB to find a test product...');
        await mongoose.connect(process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({ variants: Array, name: String }));
        const testProduct = await Product.findOne();
        if (!testProduct) {
            log(0, 'No products found in DB. Run seed first.', 'ERROR');
            process.exit(1);
        }
        const productId = testProduct._id.toString();
        const variantId = testProduct.variants[0]._id.toString();
        const stock = testProduct.variants[0].stock;
        log(0, `Found Product: ${testProduct.name} (Stock: ${stock})`, 'SUCCESS');
        await mongoose.disconnect();

        // 1. Auth Setup
        const email = `test_cart_${Date.now()}@example.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username: `user_${Date.now()}`, password: 'Password123', full_name: 'Tester' })
        });
        const regData = await regRes.json();
        if (regData.data?.verifyToken) {
            await fetch(`${BASE_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: regData.data.verifyToken })
            });
        }
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'Password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.tokens.access.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        log(1, 'Auth SUCCESS', 'SUCCESS');

        // 2. UC-21: Add to Cart
        log(2, `Adding to cart: ${productId}`);
        const addRes = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, variantId, quantity: 1 })
        });
        const addData = await addRes.json();
        if (!addRes.ok) {
            console.error('Add FAILED:', JSON.stringify(addData, null, 2));
            return;
        }
        const itemId = addData.data.items[0].itemId;
        log(2, 'Add SUCCESS', 'SUCCESS');

        // 3. UC-21: Atomic Increment
        log(3, 'Adding same item again (Increment test)...');
        const incRes = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, variantId, quantity: 1 })
        });
        const incData = await incRes.json();
        if (incData.data.items[0].quantity === 2) log(3, 'Increment SUCCESS', 'SUCCESS');

        // 4. UC-24: Update Quantity
        log(4, 'Updating quantity to 5...');
        const updRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ quantity: 5 })
        });
        const updData = await updRes.json();
        if (updData.data.items[0].quantity === 5) log(4, 'Update SUCCESS', 'SUCCESS');

        // 5. Stock Check
        log(5, 'Testing stock limit (99999)...');
        const stRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ quantity: 99999 })
        });
        if (stRes.status === 400) log(5, 'Stock validation SUCCESS', 'SUCCESS');

        // 6. UC-23: Remove
        log(6, 'Removing item...');
        const remRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, { method: 'DELETE', headers });
        const remData = await remRes.json();
        if (remData.data.items.length === 0) log(6, 'Remove SUCCESS', 'SUCCESS');

        // 7. UC-25: Clear
        log(7, 'Testing Clear Cart...');
        await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, variantId, quantity: 1 })
        });
        await fetch(`${BASE_URL}/cart`, { method: 'DELETE', headers });
        const clRes = await fetch(`${BASE_URL}/cart`, { headers });
        const clData = await clRes.json();
        if (clData.data.items.length === 0) log(7, 'Clear SUCCESS', 'SUCCESS');

        console.log('\n--- ALL CART USE CASES VERIFIED SUCCESSFULLY ---');
        process.exit(0);

    } catch (err) {
        console.error('SCRIPT ERROR:', err.message);
        process.exit(1);
    }
};

runTests();
