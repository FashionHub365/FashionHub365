const http = require('http');

function postRequest(data) {
    const dataString = JSON.stringify(data);
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/products',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length,
        },
    };

    const req = http.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
            responseBody += chunk;
        });

        res.on('end', () => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log('Response Body:', responseBody);
            console.log('--------------------------------------------------');
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.write(dataString);
    req.end();
}

console.log('--- TEST 1: Missing Required Fields (Should Fail) ---');
postRequest({
    name: "Ao thun",
    // Missing store_id and base_price
});

console.log('--- TEST 2: Invalid Data Types (Should Fail) ---');
setTimeout(() => {
    postRequest({
        name: "Ao thun",
        store_id: "store_123",
        base_price: -50000 // Negative price
    });
}, 1000);

console.log('--- TEST 3: Valid Data (Should Success) ---');
setTimeout(() => {
    postRequest({
        name: "Ao thun cotton cao cap",
        store_id: "65d4a1b2c3d4e5f6a7b8c9d0", // Mock Valid ObjectID if strictly checked, but here string check first
        base_price: 150000,
        status: "active",
        media: [
            { url: "http://example.com/image1.jpg", mediaType: "image", isPrimary: true }
        ],
        variants: [
             { sku: "AT-TRANG-M", variantName: "Trang M", price: 150000, stock: 10 }
        ]
    });
}, 2000);
