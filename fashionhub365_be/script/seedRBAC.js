const mongoose = require('mongoose');
const config = require('../config/config');
const { Permission, Role, User } = require('../models');

const permissions = [
    { code: 'USER.CREATE', module: 'USER', name: 'Create User' },
    { code: 'USER.VIEW', module: 'USER', name: 'View User' },
    { code: 'USER.UPDATE', module: 'USER', name: 'Update User' },
    { code: 'USER.DELETE', module: 'USER', name: 'Delete User' },
    { code: 'USER.ASSIGN_ROLE', module: 'USER', name: 'Assign User Role' },
    { code: 'USER.ASSIGN_PERMISSION', module: 'USER', name: 'Assign User Permission' },
    { code: 'AUTH.LOGOUT', module: 'AUTH', name: 'Logout Own Session' },
    { code: 'ROLE.CREATE', module: 'ROLE', name: 'Create Role' },
    { code: 'ROLE.VIEW', module: 'ROLE', name: 'View Role' },
    { code: 'ROLE.UPDATE', module: 'ROLE', name: 'Update Role' },
    { code: 'ROLE.DELETE', module: 'ROLE', name: 'Delete Role' },
    { code: 'PERMISSION.CREATE', module: 'PERMISSION', name: 'Create Permission' },
    { code: 'PERMISSION.VIEW', module: 'PERMISSION', name: 'View Permission' },
    { code: 'PROFILE.VIEW', module: 'PROFILE', name: 'View Own Profile' },
    { code: 'PROFILE.UPDATE', module: 'PROFILE', name: 'Update Own Profile' },
    { code: 'PROFILE.CHANGE_PASSWORD', module: 'PROFILE', name: 'Change Own Password' },
    { code: 'PROFILE.DELETE_SELF', module: 'PROFILE', name: 'Delete Own Account' },
    { code: 'ADDRESS.MANAGE', module: 'ADDRESS', name: 'Manage Own Addresses' },
    { code: 'CART.MANAGE', module: 'CART', name: 'Manage Cart' },
    { code: 'WISHLIST.MANAGE', module: 'WISHLIST', name: 'Manage Wishlist' },
    { code: 'ORDER.CREATE', module: 'ORDER', name: 'Create Own Order' },
    { code: 'ORDER.VIEW_OWN', module: 'ORDER', name: 'View Own Orders' },
    { code: 'ORDER.CANCEL_OWN', module: 'ORDER', name: 'Cancel Own Orders' },
    { code: 'REVIEW.CREATE', module: 'REVIEW', name: 'Create Product Review' },
    { code: 'REVIEW.VIEW_OWN', module: 'REVIEW', name: 'View Own Reviews' },
    { code: 'REVIEW.UPDATE_OWN', module: 'REVIEW', name: 'Update Own Reviews' },
    { code: 'REVIEW.DELETE_OWN', module: 'REVIEW', name: 'Delete Own Reviews' },
    { code: 'PAYMENT.CREATE', module: 'PAYMENT', name: 'Create Payment' },
    { code: 'PAYMENT.VIEW_OWN', module: 'PAYMENT', name: 'View Own Payments' },
    { code: 'PAYMENT.CANCEL_OWN', module: 'PAYMENT', name: 'Cancel Own Payment' },
    { code: 'STORE.CREATE', module: 'STORE', name: 'Create Store' },
    { code: 'STORE.FOLLOW', module: 'STORE', name: 'Follow Store' },
    { code: 'STORE.VIEW', module: 'STORE', name: 'View Store' },
    { code: 'STORE.UPDATE', module: 'STORE', name: 'Update Store' },
    { code: 'STORE.PRODUCT.CREATE', module: 'STORE', name: 'Create Store Product' },
    { code: 'STORE.PRODUCT.VIEW', module: 'STORE', name: 'View Store Product' },
    { code: 'STORE.PRODUCT.UPDATE', module: 'STORE', name: 'Update Store Product' },
    { code: 'STORE.PRODUCT.DELETE', module: 'STORE', name: 'Delete Store Product' },
    { code: 'STORE.ORDER.VIEW', module: 'STORE', name: 'View Store Order' },
    { code: 'STORE.ORDER.UPDATE', module: 'STORE', name: 'Update Store Order' },
    { code: 'PAYOUT.REQUEST', module: 'PAYOUT', name: 'Request Payout' },
    { code: 'PAYOUT.VIEW', module: 'PAYOUT', name: 'View Payouts' },
    { code: 'PAYOUT.PROCESS', module: 'PAYOUT', name: 'Process Payout (Admin)' },
];

const BASE_USER_PERMISSION_CODES = [
    'AUTH.LOGOUT',
    'PROFILE.VIEW',
    'PROFILE.UPDATE',
    'PROFILE.CHANGE_PASSWORD',
    'PROFILE.DELETE_SELF',
    'ADDRESS.MANAGE',
    'CART.MANAGE',
    'WISHLIST.MANAGE',
    'ORDER.CREATE',
    'ORDER.VIEW_OWN',
    'ORDER.CANCEL_OWN',
    'REVIEW.CREATE',
    'REVIEW.VIEW_OWN',
    'REVIEW.UPDATE_OWN',
    'REVIEW.DELETE_OWN',
    'PAYMENT.CREATE',
    'PAYMENT.VIEW_OWN',
    'PAYMENT.CANCEL_OWN',
    'STORE.CREATE',
    'STORE.FOLLOW',
];

const SELF_ACCOUNT_PERMISSION_CODES = [
    'AUTH.LOGOUT',
    'PROFILE.VIEW',
    'PROFILE.UPDATE',
    'PROFILE.CHANGE_PASSWORD',
];

const ADMIN_OPERATIONS_PERMISSION_CODES = [
    'USER.VIEW',
    'USER.UPDATE',
    'USER.ASSIGN_ROLE',
    'USER.ASSIGN_PERMISSION',
    'ROLE.VIEW',
    'ROLE.UPDATE',
    'PERMISSION.VIEW',
    ...SELF_ACCOUNT_PERMISSION_CODES,
];

const STORE_MANAGEMENT_PERMISSION_CODES = [
    'STORE.VIEW',
    'STORE.UPDATE',
    'STORE.PRODUCT.CREATE',
    'STORE.PRODUCT.VIEW',
    'STORE.PRODUCT.UPDATE',
    'STORE.PRODUCT.DELETE',
    'STORE.ORDER.UPDATE',
    'PAYOUT.REQUEST',
    'PAYOUT.VIEW',
    ...BASE_USER_PERMISSION_CODES,
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
        permissionCodes: ADMIN_OPERATIONS_PERMISSION_CODES,
    },
    {
        name: 'Staff',
        slug: 'staff',
        scope: 'GLOBAL',
        description: 'Operational staff',
        permissionCodes: ['USER.VIEW', 'STORE.VIEW', ...SELF_ACCOUNT_PERMISSION_CODES],
    },
    {
        name: 'Operator',
        slug: 'operator',
        scope: 'GLOBAL',
        description: 'Operations manager',
        permissionCodes: ['USER.VIEW', 'USER.UPDATE', 'STORE.VIEW', 'STORE.UPDATE', ...SELF_ACCOUNT_PERMISSION_CODES],
    },
    {
        name: 'Finance',
        slug: 'finance',
        scope: 'GLOBAL',
        description: 'Finance backoffice',
        permissionCodes: ['ROLE.VIEW', 'PERMISSION.VIEW', 'PAYOUT.VIEW', 'PAYOUT.PROCESS', ...SELF_ACCOUNT_PERMISSION_CODES],
    },
    {
        name: 'Customer Support',
        slug: 'cs',
        scope: 'GLOBAL',
        description: 'Customer support agent',
        permissionCodes: ['USER.VIEW', ...SELF_ACCOUNT_PERMISSION_CODES],
    },
    {
        name: 'User',
        slug: 'user',
        scope: 'GLOBAL',
        description: 'Default authenticated user role',
        permissionCodes: BASE_USER_PERMISSION_CODES,
    },
    {
        name: 'Customer',
        slug: 'customer',
        scope: 'GLOBAL',
        description: 'Legacy customer role',
        permissionCodes: BASE_USER_PERMISSION_CODES,
    },
    {
        name: 'Seller',
        slug: 'seller',
        scope: 'GLOBAL',
        description: 'Seller role for store onboarding and basic account actions',
        permissionCodes: [...BASE_USER_PERMISSION_CODES, 'STORE.VIEW'],
    },
    {
        name: 'Store Owner',
        slug: 'store-owner',
        scope: 'STORE',
        description: 'Owner of a store',
        permissionCodes: STORE_MANAGEMENT_PERMISSION_CODES,
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

const seedRBAC = async () => {
    const dbPermissions = await seedPermissions();
    const roles = await seedRoles(dbPermissions);
    await seedAdminUser(roles['super-admin'] || roles.admin);

    return { permissions: dbPermissions, roles };
};

const run = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to MongoDB');

        await seedRBAC();

        console.log('RBAC seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

module.exports = {
    seedRBAC,
    seedPermissions,
    seedRoles,
    seedAdminUser,
};

if (require.main === module) {
    run();
}
