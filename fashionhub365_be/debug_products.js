const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Store = require('./models/Store');
const User = require('./models/User');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashionhub365');
        console.log('Connected to MongoDB');

        const totalProducts = await Product.countDocuments();
        console.log('Total products in DB:', totalProducts);

        const usersCount = await User.countDocuments();
        console.log('Total users:', usersCount);

        const stores = await Store.find();
        console.log('Total stores:', stores.length);
        stores.forEach(s => console.log(`Store: ${s.name}, ID: ${s._id}, Owner: ${s.owner_user_id}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
