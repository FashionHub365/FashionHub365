const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const db = mongoose.connection.db;
        const collection = db.collection('securityevents');

        // 1. Drop index
        try {
            console.log('Dropping uuid_1 index...');
            await collection.dropIndex('uuid_1');
            console.log('Index uuid_1 dropped successfully.');
        } catch (err) {
            console.log('Index uuid_1 drop info:', err.message);
        }

        // 2. Clear conflicting docs
        await collection.deleteMany({ uuid: null });
        console.log('Cleared conflicting docs.');

        // 3. Generate correct hash for 'password123'
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);
        console.log('\n=================================================');
        console.log('CORRECT HASH FOR password123:');
        console.log(hash);
        console.log('=================================================\n');

        // 4. Update seller_test user
        const users = db.collection('users');
        await users.updateOne(
            { email: 'seller@test.com' },
            { $set: { password_hash: hash, is_email_verified: true, status: 'ACTIVE' } },
            { upsert: true }
        );
        console.log('Updated seller@test.com password successfully.');

        console.log('\nBạn hãy thử login lại với:');
        console.log('Email: seller@test.com');
        console.log('Password: password123');
        
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error.message);
        process.exit(1);
    }
};

fix();
