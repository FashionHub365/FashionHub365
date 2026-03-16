require('dotenv').config();
const connectDB = require('../config/db');
const { Product, User, ProductReview } = require('../models');

const generateReviews = async () => {
    try {
        await connectDB();
        console.log('Clearing old reviews...');
        await ProductReview.deleteMany({});

        let user = await User.findOne({ role: 'user' });
        if (!user) user = await User.findOne();

        if (!user) {
            console.log('No user found to create reviews. Exiting.');
            process.exit(0);
        }

        const products = await Product.find({ status: 'active' }).limit(30);
        console.log(`Found ${products.length} active products to review.`);

        let count = 0;

        for (const product of products) {
            // Create 2-3 random reviews per product
            const reviewCount = Math.floor(Math.random() * 2) + 2;

            let totalRating = 0;

            for (let i = 0; i < reviewCount; i++) {
                const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
                totalRating += rating;

                await ProductReview.create({
                    product_id: product._id,
                    user_id: user._id,
                    rating,
                    title: rating === 5 ? "Great quality!" : "Pretty good",
                    content: rating === 5
                        ? "Absolutely love this item! The fit is perfect and the material is top notch."
                        : "Good product overall. Fits slightly loose but very comfortable.",
                    verified_purchase: true,
                    reviewer_info: {
                        name: "Elizabeth_" + Math.floor(Math.random() * 100),
                        height: "5'9\" - 5'11\"",
                        weight: "161 - 180 lb",
                        body_type: "Petite",
                        size_purchased: "L"
                    }
                });
                count++;
            }

            // update product aggregate manually since we are seeding
            product.rating.average = totalRating / reviewCount;
            product.rating.count = reviewCount;
            await product.save();
        }

        console.log(`Seeded ${count} product reviews successfully!`);
        process.exit();
    } catch (err) {
        console.error('Error seeding reviews:', err);
        process.exit(1);
    }
};

generateReviews();
