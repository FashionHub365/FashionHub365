const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Product } = require('./models');

const testSlug = 'v2-slim-fit-jeans-86c29ee60c86f';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to DB');

        const productId = testSlug;
        let query = { status: 'active' };

        if (mongoose.Types.ObjectId.isValid(productId)) {
            console.log('Testing as ID');
            query._id = productId;
        } else {
            console.log('Testing as Slug');
            query.slug = { $regex: new RegExp(`^${productId.trim()}$`, 'i') };
        }

        console.log('Query:', JSON.stringify(query, null, 2));

        const product = await Product.findOne(query);
        if (product) {
            console.log('SUCCESS: Found product!');
            console.log('Name:', product.name);
            console.log('ID:', product._id);
        } else {
            console.log('FAILED: Product not found with status active');
            const anyProduct = await Product.findOne({ slug: productId });
            if (anyProduct) {
                console.log('Found with DIFFERENT status:', anyProduct.status);
            } else {
                console.log('Not found EVEN WITHOUT status filter');
                const allSlugs = await Product.find({}).limit(10).select('slug');
                console.log('Sample slugs in DB:', allSlugs.map(p => p.slug));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
