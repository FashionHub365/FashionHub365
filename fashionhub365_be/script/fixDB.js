const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { User, Role, SecurityEvent } = require('../models');
const connectDB = require('../config/db');

const fixAndSeed = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...');

        // 1. Drop the ghost index on SecurityEvent
        try {
            console.log('Checking indices on securityevents...');
            const indexes = await SecurityEvent.collection.indexes();
            console.log('Current indexes:', indexes.map(i => i.name));
            
            if (indexes.some(i => i.name === 'uuid_1')) {
                console.log('Dropping uuid_1 index...');
                await SecurityEvent.collection.dropIndex('uuid_1');
                console.log('Index uuid_1 dropped successfully.');
            } else {
                console.log('Index uuid_1 not found.');
            }
        } catch (err) {
            console.error('Error handling index:', err.message);
        }

        // 2. Clear conflicting SecurityEvents
        await SecurityEvent.deleteMany({ uuid: null });
        console.log('Cleared conflicting SecurityEvents documents.');

        // 3. Ensure Roles exist
        const roles = [
            { name: 'Admin', slug: 'admin', description: 'System Administrator', scope: 'GLOBAL', is_system: true },
            { name: 'Seller', slug: 'seller', description: 'Store Owner', scope: 'GLOBAL', is_system: true },
            { name: 'Customer', slug: 'customer', description: 'Regular Buyer', scope: 'GLOBAL', is_system: true }
        ];
        for (const roleData of roles) {
            await Role.findOneAndUpdate({ slug: roleData.slug }, roleData, { upsert: true });
        }

        const adminRole = await Role.findOne({ slug: 'admin' });
        const sellerRole = await Role.findOne({ slug: 'seller' });

        // 4. Create Users
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash('password123', salt);

        const users = [
            {
                username: 'admin_test',
                email: 'admin@test.com',
                password_hash: hashed_password,
                is_email_verified: true,
                status: 'ACTIVE',
                global_role_ids: [adminRole._id],
                profile: { full_name: 'System Admin' }
            },
            {
                username: 'seller_test',
                email: 'seller@test.com',
                password_hash: hashed_password,
                is_email_verified: true,
                status: 'ACTIVE',
                global_role_ids: [sellerRole._id],
                profile: { full_name: 'Fashion Seller' }
            }
        ];

        for (const userData of users) {
            await User.findOneAndUpdate({ email: userData.email }, userData, { upsert: true });
            console.log(`Updated user: ${userData.email}`);
        }

        console.log('SUCCESS: Use seller@test.com / password123 to login.');
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
};

fixAndSeed();
