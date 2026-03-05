const mongoose = require('mongoose');
const config = require('../config/config');
const { Permission, Role, User } = require('../models');

const permissions = [
    { code: 'USER.CREATE', module: 'USER', name: 'Create User' },
    { code: 'USER.VIEW', module: 'USER', name: 'View User' },
    { code: 'USER.UPDATE', module: 'USER', name: 'Update User' },
    { code: 'USER.DELETE', module: 'USER', name: 'Delete User' },
    { code: 'USER.ASSIGN_ROLE', module: 'USER', name: 'Assign User Role' },
    { code: 'ROLE.CREATE', module: 'ROLE', name: 'Create Role' },
    { code: 'ROLE.VIEW', module: 'ROLE', name: 'View Role' },
    { code: 'ROLE.UPDATE', module: 'ROLE', name: 'Update Role' },
    { code: 'ROLE.DELETE', module: 'ROLE', name: 'Delete Role' },
    { code: 'PERMISSION.CREATE', module: 'PERMISSION', name: 'Create Permission' },
    { code: 'PERMISSION.VIEW', module: 'PERMISSION', name: 'View Permission' },
    { code: 'STORE.VIEW', module: 'STORE', name: 'View Store' },
    { code: 'STORE.UPDATE', module: 'STORE', name: 'Update Store' },
    { code: 'STORE.PRODUCT.CREATE', module: 'STORE', name: 'Create Store Product' },
];

const roleDefinitions = [
    {
        name: 'Super Admin',
        slug: 'super-admin',
        scope: 'GLOBAL',
        description: 'Full platform access',
        permissionCodes: permissions.map((permission) => permission.code),
    },
    {
        name: 'Administrator',
        slug: 'admin',
        scope: 'GLOBAL',
        description: 'System administrator',
        permissionCodes: permissions.map((permission) => permission.code),
    },
    {
        name: 'Staff',
        slug: 'staff',
        scope: 'GLOBAL',
        description: 'Operational staff',
        permissionCodes: ['USER.VIEW', 'STORE.VIEW'],
    },
    {
        name: 'Operator',
        slug: 'operator',
        scope: 'GLOBAL',
        description: 'Operations manager',
        permissionCodes: ['USER.VIEW', 'USER.UPDATE', 'STORE.VIEW', 'STORE.UPDATE'],
    },
    {
        name: 'Finance',
        slug: 'finance',
        scope: 'GLOBAL',
        description: 'Finance backoffice',
        permissionCodes: ['ROLE.VIEW', 'PERMISSION.VIEW'],
    },
    {
        name: 'Customer Support',
        slug: 'cs',
        scope: 'GLOBAL',
        description: 'Customer support agent',
        permissionCodes: ['USER.VIEW'],
    },
    {
        name: 'User',
        slug: 'user',
        scope: 'GLOBAL',
        description: 'Default authenticated user role',
        permissionCodes: [],
    },
    {
        name: 'Customer',
        slug: 'customer',
        scope: 'GLOBAL',
        description: 'Legacy customer role',
        permissionCodes: [],
    },
    {
        name: 'Seller',
        slug: 'seller',
        scope: 'GLOBAL',
        description: 'Seller role placeholder',
        permissionCodes: ['STORE.VIEW'],
    },
    {
        name: 'Store Owner',
        slug: 'store-owner',
        scope: 'STORE',
        description: 'Owner of a store',
        permissionCodes: ['STORE.VIEW', 'STORE.UPDATE', 'STORE.PRODUCT.CREATE'],
    },
];

const seedPermissions = async () => {
    const dbPermissions = [];
    for (const permission of permissions) {
        const savedPermission = await Permission.findOneAndUpdate(
            { code: permission.code },
            { $set: permission },
            { upsert: true, returnDocument: 'after' }
        );
        dbPermissions.push(savedPermission);
    }
    return dbPermissions;
};

const seedRoles = async (allPermissions) => {
    const permissionMap = new Map(allPermissions.map((permission) => [permission.code, permission._id]));
    const createdRoles = {};

    for (const roleDefinition of roleDefinitions) {
        const permissionIds = roleDefinition.permissionCodes
            .map((code) => permissionMap.get(code))
            .filter(Boolean);

        const role = await Role.findOneAndUpdate(
            { slug: roleDefinition.slug },
            {
                $set: {
                    name: roleDefinition.name,
                    slug: roleDefinition.slug,
                    scope: roleDefinition.scope,
                    description: roleDefinition.description,
                    permission_ids: permissionIds,
                    is_system: true,
                },
            },
            { upsert: true, returnDocument: 'after' }
        );

        createdRoles[roleDefinition.slug] = role;
    }

    return createdRoles;
};

const seedAdminUser = async (adminRole) => {
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
            profile: { full_name: 'Super Admin' },
        });
        console.log(`Created Admin User: ${email} / ${password}`);
        return;
    }

    const roleIds = new Set((admin.global_role_ids || []).map((id) => id.toString()));
    if (!roleIds.has(adminRole._id.toString())) {
        admin.global_role_ids.push(adminRole._id);
        await admin.save();
        console.log('Assigned admin role to existing admin user');
    }
};

const run = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to MongoDB');

        const dbPermissions = await seedPermissions();
        const roles = await seedRoles(dbPermissions);
        await seedAdminUser(roles['super-admin'] || roles.admin);

        console.log('RBAC seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

run();
