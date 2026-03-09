const mongoose = require('mongoose');
const { Product } = require('./models');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const findProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const product = await Product.findOne().select('_id');
        fs.writeFileSync('product_id.txt', product._id.toString());
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

findProduct();
