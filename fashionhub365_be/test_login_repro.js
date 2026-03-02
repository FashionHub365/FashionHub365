const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1/auth';

const run = async () => {
    const email = `TestUser_${Date.now()}@example.com`;
    const password = 'Password@123';

    console.log(`1. Registering with email: ${email}`);
    try {
        await axios.post(`${BASE_URL}/register`, {
            email: email, // Mixed case
            username: `user_${Date.now()}`,
            password: password,
            full_name: 'Test User'
        });
        console.log('   Registration SUCCESS (201)');
    } catch (e) {
        console.error('   Registration FAILED', e.response?.data || e.message);
        return;
    }

    console.log(`2. Logging in with SAME Mixed Case email: ${email}`);
    try {
        await axios.post(`${BASE_URL}/login`, {
            email: email,
            password: password
        });
        console.log('   Login SUCCESS');
    } catch (e) {
        console.error('   Login FAILED (Expected if case-sensitive)', e.response?.data || e.message);
    }

    console.log(`3. Logging in with LOWERCASE email: ${email.toLowerCase()}`);
    try {
        await axios.post(`${BASE_URL}/login`, {
            email: email.toLowerCase(),
            password: password
        });
        console.log('   Login SUCCESS');
    } catch (e) {
        console.error('   Login FAILED', e.response?.data || e.message);
    }
};

run();
