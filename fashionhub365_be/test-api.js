const axios = require('axios');

async function testApi() {
    try {
        console.log('Testing ProductDetail API call...');
        const res = await axios.get('http://localhost:5000/api/v1/listing/products/v2-slim-fit-jeans-86c29ee60c86f');
        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error('Error Response Status:', error.response?.status);
        console.error('Error Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testApi();
