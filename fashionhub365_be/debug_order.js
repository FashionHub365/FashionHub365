const mongoose = require('mongoose');
const Order = require('./models/Order');
const Store = require('./models/Store');
const User = require('./models/User');

const DB_URI = 'mongodb://localhost:27017/fashionhub365'; // Adjust if needed

async function debug() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to DB');

        const orderId = '69a9a9413a74d7ba09f91129';
        const order = await Order.findById(orderId);

        if (!order) {
            console.log('Order NOT found in DB at all');
            const allOrders = await Order.find().limit(5);
            console.log('Sample orders:', JSON.stringify(allOrders, null, 2));
            return;
        }

        console.log('Order found:', JSON.stringify(order, null, 2));
        console.log('Order store_id:', order.store_id);

        const store = await Store.findById(order.store_id);
        console.log('Store found:', JSON.stringify(store, null, 2));

        if (store) {
            const owner = await User.findById(store.owner_user_id);
            console.log('Store owner:', owner ? owner.email : 'Not found');
        }

    } catch (err) {
        console.error('Debug error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
