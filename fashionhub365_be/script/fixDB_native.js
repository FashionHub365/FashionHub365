const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = 'FashionHub365DB'; // Adjust if needed

const fix = async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB natively...');
        const db = client.db(dbName);
        const securityEvents = db.collection('securityevents');

        // 1. Drop the ghost index
        try {
            console.log('Dropping uuid_1 index...');
            await securityEvents.dropIndex('uuid_1');
            console.log('Index uuid_1 dropped successfully.');
        } catch (err) {
            console.log('Index uuid_1 drop error (maybe not found):', err.message);
        }

        // 2. Clear conflicting docs
        await securityEvents.deleteMany({ uuid: null });
        console.log('Cleared null uuid docs.');

        // 3. Seed Users and Roles via Native Driver to be safe
        const roles = db.collection('roles');
        const users = db.collection('users');

        const roleData = [
            { name: 'Admin', slug: 'admin', description: 'System Administrator', scope: 'GLOBAL', is_system: true, created_at: new Date(), updated_at: new Date() },
            { name: 'Seller', slug: 'seller', description: 'Store Owner', scope: 'GLOBAL', is_system: true, created_at: new Date(), updated_at: new Date() },
            { name: 'Customer', slug: 'customer', description: 'Regular Buyer', scope: 'GLOBAL', is_system: true, created_at: new Date(), updated_at: new Date() }
        ];

        for (const r of roleData) {
            await roles.updateOne({ slug: r.slug }, { $set: r }, { upsert: true });
        }

        const adminR = await roles.findOne({ slug: 'admin' });
        const sellerR = await roles.findOne({ slug: 'seller' });

        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash('password123', salt);

        const userData = [
            {
                username: 'admin_test',
                email: 'admin@test.com',
                password_hash: hashed_password,
                is_email_verified: true,
                status: 'ACTIVE',
                global_role_ids: [adminR._id],
                profile: { full_name: 'System Admin' },
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                username: 'seller_test',
                email: 'seller@test.com',
                password_hash: hashed_password,
                is_email_verified: true,
                status: 'ACTIVE',
                global_role_ids: [sellerR._id],
                profile: { full_name: 'Fashion Seller' },
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        for (const u of userData) {
            await users.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }

        console.log('DONE! Try logging in now.');
        process.exit(0);
    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

fix();
