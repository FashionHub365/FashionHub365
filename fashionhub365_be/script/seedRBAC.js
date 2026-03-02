const mongoose = require('mongoose');
const config = require('../config/config');
const { Permission, Role, User } = require('../models');

// Define Permissions
const permissions = [
    // User
    { code: 'USER.CREATE', module: 'USER', name: 'Create User' },
    { code: 'USER.VIEW', module: 'USER', name: 'View User' },
    { code: 'USER.UPDATE', module: 'USER', name: 'Update User' },
    { code: 'USER.DELETE', module: 'USER', name: 'Delete User' },
    { code: 'USER.ASSIGN_ROLE', module: 'USER', name: 'Assign User Role' },

    // Role
    { code: 'ROLE.CREATE', module: 'ROLE', name: 'Create Role' },
    { code: 'ROLE.VIEW', module: 'ROLE', name: 'View Role' },
    { code: 'ROLE.UPDATE', module: 'ROLE', name: 'Update Role' },
    { code: 'ROLE.DELETE', module: 'ROLE', name: 'Delete Role' },

    // Permission
    { code: 'PERMISSION.CREATE', module: 'PERMISSION', name: 'Create Permission' },
    { code: 'PERMISSION.VIEW', module: 'PERMISSION', name: 'View Permission' },

    // Store (for Store Owner)
    { code: 'STORE.VIEW', module: 'STORE', name: 'View Store' },
    { code: 'STORE.UPDATE', module: 'STORE', name: 'Update Store' },
    { code: 'STORE.PRODUCT.CREATE', module: 'STORE', name: 'Create Store Product' },
];

const seedPermissions = async () => {
    console.log('--- Seeding Permissions ---');
    const dbPermissions = [];
    for (const perm of permissions) {
        let p = await Permission.findOne({ code: perm.code });
        if (!p) {
            p = await Permission.create(perm);
            console.log(`Created permission: ${perm.code}`);
        }
        dbPermissions.push(p);
    }
    return dbPermissions;
};

const seedRoles = async (allPermissions) => {
    console.log('--- Seeding Roles ---');

    // 1. GLOBAL: ADMIN (All Permissions)
    let adminRole = await Role.findOne({ slug: 'admin' });
    if (!adminRole) {
        adminRole = await Role.create({
            name: 'Administrator',
            slug: 'admin',
            scope: 'GLOBAL',
            description: 'System Administrator',
            permission_ids: allPermissions.map(p => p._id),
            is_system: true
        });
        console.log('Created Role: ADMIN');
    } else {
        // Update permissions for admin to always have all
        adminRole.permission_ids = allPermissions.map(p => p._id);
        await adminRole.save();
        console.log('Updated Role: ADMIN with all permissions');
    }

    // 2. GLOBAL: CUSTOMER (Basic)
    let customerRole = await Role.findOne({ slug: 'customer' });
    if (!customerRole) {
        customerRole = await Role.create({
            name: 'Customer',
            slug: 'customer',
            scope: 'GLOBAL',
            description: 'Default customer role',
            permission_ids: [], // Usually no special permissions, just auth
            is_system: true
        });
        console.log('Created Role: CUSTOMER');
    }

    // 3. STORE: STORE_OWNER
    let storeOwnerRole = await Role.findOne({ slug: 'store-owner' });
    if (!storeOwnerRole) {
        // Filter store permissions
        const storePerms = allPermissions.filter(p => p.module === 'STORE');
        storeOwnerRole = await Role.create({
            name: 'Store Owner',
            slug: 'store-owner',
            scope: 'STORE',
            description: 'Owner of a store',
            permission_ids: storePerms.map(p => p._id),
            is_system: true
        });
        console.log('Created Role: STORE_OWNER');
    }

    return { adminRole, customerRole, storeOwnerRole };
};

const seedAdminUser = async (adminRole) => {
    console.log('--- Seeding Admin User ---');
    const email = process.env.ADMIN_EMAIL || 'admin@fashionhub365.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';

    let admin = await User.findOne({ email });
    if (!admin) {
        admin = await User.create({
            email,
            password_hash: await require('bcryptjs').hash(password, 10),
            username: 'admin',
            status: 'ACTIVE',
            is_email_verified: true,
            global_role_ids: [adminRole._id],
            profile: { full_name: 'Super Admin' }
        });
        console.log(`Created Admin User: ${email} / ${password}`);
    } else {
        // Ensure admin has admin role
        if (!admin.global_role_ids.includes(adminRole._id)) {
            admin.global_role_ids.push(adminRole._id);
            await admin.save();
            console.log('Assigned ADMIN role to existing admin user');
        }
        console.log('Admin user already exists');
    }
};

const run = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to MongoDB');

        const dbPermissions = await seedPermissions();
        const { adminRole } = await seedRoles(dbPermissions);
        await seedAdminUser(adminRole);

        console.log('--- Seeding Completed ---');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

run();
