require('dotenv').config();
const connectDB = require('../config/db');
const models = require('../models');

const {
    User, Role, Permission, Brand, Category, Tag, Collection,
    Store, Product, SystemSetting
} = models;

// Flag to clean database before seeding
const shouldClean = process.argv.includes('--clean');

// Sample data
const seedData = {
    roles: [
        {
            name: 'Admin',
            slug: 'admin',
            scope: 'GLOBAL',
            description: 'System administrator with full access',
            is_system: true,
            permission_codes: ['user.read', 'user.write', 'user.delete', 'store.read', 'store.write', 'store.delete', 'product.read', 'product.write', 'product.delete', 'order.read', 'order.write']
        },
        {
            name: 'StoreOwner',
            slug: 'store-owner',
            scope: 'STORE',
            description: 'Store owner who can manage their store and products',
            is_system: true,
            permission_codes: ['store.read', 'store.write', 'product.read', 'product.write', 'order.read']
        },
        {
            name: 'Customer',
            slug: 'customer',
            scope: 'GLOBAL',
            description: 'Regular customer who can browse and purchase',
            is_system: true,
            permission_codes: ['product.read', 'order.read']
        }
    ],

    users: [
        {
            username: 'admin',
            email: 'admin@fashionhub365.com',
            password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // Mock hash
            status: 'ACTIVE',
            profile: {
                fullName: 'System Administrator',
                phone: '0901234567',
                gender: 'Other'
            }
        },
        {
            username: 'seller1',
            email: 'seller1@example.com',
            password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            status: 'ACTIVE',
            profile: {
                fullName: 'Nguyen Van A',
                phone: '0912345678',
                gender: 'Male'
            }
        },
        {
            username: 'seller2',
            email: 'seller2@example.com',
            password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            status: 'ACTIVE',
            profile: {
                fullName: 'Tran Thi B',
                phone: '0923456789',
                gender: 'Female'
            }
        },
        {
            username: 'customer1',
            email: 'customer1@example.com',
            password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            status: 'ACTIVE',
            profile: {
                fullName: 'Le Van C',
                phone: '0934567890',
                gender: 'Male'
            }
        },
        {
            username: 'customer2',
            email: 'customer2@example.com',
            password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            status: 'ACTIVE',
            profile: {
                fullName: 'Pham Thi D',
                phone: '0945678901',
                gender: 'Female'
            }
        }
    ],

    brands: [
        { name: 'Nike', description: 'Just Do It - Leading sportswear brand' },
        { name: 'Adidas', description: 'Impossible is Nothing - German sportswear manufacturer' },
        { name: 'Gucci', description: 'Luxury Italian fashion brand' },
        { name: 'Zara', description: 'Spanish fast fashion retailer' },
        { name: 'H&M', description: 'Swedish multinational clothing company' },
        { name: 'Uniqlo', description: 'Japanese casual wear designer and retailer' },
        { name: 'Louis Vuitton', description: 'French luxury fashion house' },
        { name: 'Chanel', description: 'French luxury fashion house' },
        { name: 'Prada', description: 'Italian luxury fashion house' },
        { name: 'Balenciaga', description: 'Luxury fashion house' }
    ],

    categories: [
        // Root categories
        { name: 'Men', slug: 'men', description: 'Fashion for men', parent: null },
        { name: 'Women', slug: 'women', description: 'Fashion for women', parent: null },
        { name: 'Kids', slug: 'kids', description: 'Fashion for children', parent: null },

        // Men subcategories
        { name: 'Men Clothing', slug: 'men-clothing', description: 'Clothing for men', parent: 'Men' },
        { name: 'Men Shoes', slug: 'men-shoes', description: 'Shoes for men', parent: 'Men' },
        { name: 'Men Accessories', slug: 'men-accessories', description: 'Accessories for men', parent: 'Men' },

        // Women subcategories
        { name: 'Women Clothing', slug: 'women-clothing', description: 'Clothing for women', parent: 'Women' },
        { name: 'Women Shoes', slug: 'women-shoes', description: 'Shoes for women', parent: 'Women' },
        { name: 'Women Accessories', slug: 'women-accessories', description: 'Accessories for women', parent: 'Women' },

        // Clothing types
        { name: 'T-Shirts', slug: 'tshirts', description: 'T-Shirts and tops', parent: 'Men Clothing' },
        { name: 'Jeans', slug: 'jeans', description: 'Denim jeans', parent: 'Men Clothing' },
        { name: 'Jackets', slug: 'jackets', description: 'Jackets and coats', parent: 'Men Clothing' },
        { name: 'Dresses', slug: 'dresses', description: 'Dresses', parent: 'Women Clothing' },
        { name: 'Skirts', slug: 'skirts', description: 'Skirts', parent: 'Women Clothing' },
        { name: 'Blouses', slug: 'blouses', description: 'Blouses and tops', parent: 'Women Clothing' },

        // Shoes types
        { name: 'Sneakers', slug: 'sneakers', description: 'Casual sneakers', parent: 'Men Shoes' },
        { name: 'Boots', slug: 'boots', description: 'Boots', parent: 'Men Shoes' },
        { name: 'Heels', slug: 'heels', description: 'High heels', parent: 'Women Shoes' },
        { name: 'Flats', slug: 'flats', description: 'Flat shoes', parent: 'Women Shoes' }
    ],

    tags: [
        { name: 'Sale' },
        { name: 'New Arrival' },
        { name: 'Trending' },
        { name: 'Best Seller' },
        { name: 'Limited Edition' },
        { name: 'Eco-Friendly' },
        { name: 'Premium' },
        { name: 'Clearance' }
    ],

    collections: [
        { name: 'Summer 2026', description: 'Hot summer collection', status: 'active' },
        { name: 'Winter Collection', description: 'Cozy winter wear', status: 'active' },
        { name: 'Spring Essentials', description: 'Fresh spring styles', status: 'active' },
        { name: 'Urban Street', description: 'Streetwear collection', status: 'active' },
        { name: 'Formal Wear', description: 'Professional attire', status: 'active' }
    ],

    stores: [
        {
            name: 'Fashion Central',
            slug: 'fashion-central',
            description: 'Your one-stop shop for trendy fashion',
            email: 'contact@fashioncentral.com',
            phone: '0912345678',
            status: 'active',
            is_draft: false,
            level: { value: 'premium' }
        },
        {
            name: 'Street Style Hub',
            slug: 'street-style-hub',
            description: 'Urban streetwear and casual fashion',
            email: 'hello@streetstylehub.com',
            phone: '0923456789',
            status: 'active',
            is_draft: false,
            level: { value: 'trusted' }
        }
    ],

    products: [
        {
            name: 'Classic White T-Shirt',
            slug: 'classic-white-tshirt',
            short_description: 'Premium cotton white t-shirt',
            description: 'High-quality 100% cotton t-shirt perfect for everyday wear',
            base_price: 299000,
            status: 'active',
            media: [
                { mediaType: 'image', url: 'https://via.placeholder.com/500x500?text=White+Tshirt', isPrimary: true, sortOrder: 1 }
            ],
            variants: [
                { sku: 'WT-S', variantName: 'Small', price: 299000, stock: 50, attributes: { size: 'S', color: 'White' } },
                { sku: 'WT-M', variantName: 'Medium', price: 299000, stock: 100, attributes: { size: 'M', color: 'White' } },
                { sku: 'WT-L', variantName: 'Large', price: 299000, stock: 75, attributes: { size: 'L', color: 'White' } }
            ]
        },
        {
            name: 'Slim Fit Blue Jeans',
            slug: 'slim-fit-blue-jeans',
            short_description: 'Comfortable slim fit denim jeans',
            description: 'Modern slim fit jeans made from premium denim fabric',
            base_price: 799000,
            status: 'active',
            media: [
                { mediaType: 'image', url: 'https://via.placeholder.com/500x500?text=Blue+Jeans', isPrimary: true, sortOrder: 1 }
            ],
            variants: [
                { sku: 'BJ-30', variantName: '30', price: 799000, stock: 30, attributes: { size: '30', color: 'Blue' } },
                { sku: 'BJ-32', variantName: '32', price: 799000, stock: 50, attributes: { size: '32', color: 'Blue' } },
                { sku: 'BJ-34', variantName: '34', price: 799000, stock: 40, attributes: { size: '34', color: 'Blue' } }
            ]
        },
        {
            name: 'Nike Air Max Sneakers',
            slug: 'nike-air-max-sneakers',
            short_description: 'Iconic Nike Air Max running shoes',
            description: 'Legendary comfort and style with Nike Air technology',
            base_price: 2499000,
            status: 'active',
            media: [
                { mediaType: 'image', url: 'https://via.placeholder.com/500x500?text=Nike+Sneakers', isPrimary: true, sortOrder: 1 }
            ],
            variants: [
                { sku: 'NAM-40', variantName: 'EU 40', price: 2499000, stock: 20, attributes: { size: '40', color: 'Black/White' } },
                { sku: 'NAM-41', variantName: 'EU 41', price: 2499000, stock: 25, attributes: { size: '41', color: 'Black/White' } },
                { sku: 'NAM-42', variantName: 'EU 42', price: 2499000, stock: 30, attributes: { size: '42', color: 'Black/White' } }
            ]
        },
        {
            name: 'Elegant Summer Dress',
            slug: 'elegant-summer-dress',
            short_description: 'Flowy summer dress for any occasion',
            description: 'Beautiful lightweight dress perfect for summer events',
            base_price: 1299000,
            status: 'active',
            media: [
                { mediaType: 'image', url: 'https://via.placeholder.com/500x500?text=Summer+Dress', isPrimary: true, sortOrder: 1 }
            ],
            variants: [
                { sku: 'SD-S', variantName: 'Small', price: 1299000, stock: 25, attributes: { size: 'S', color: 'Floral' } },
                { sku: 'SD-M', variantName: 'Medium', price: 1299000, stock: 35, attributes: { size: 'M', color: 'Floral' } },
                { sku: 'SD-L', variantName: 'Large', price: 1299000, stock: 20, attributes: { size: 'L', color: 'Floral' } }
            ]
        },
        {
            name: 'Leather Jacket',
            slug: 'leather-jacket',
            short_description: 'Premium leather biker jacket',
            description: 'Genuine leather jacket with classic biker styling',
            base_price: 3999000,
            status: 'active',
            media: [
                { mediaType: 'image', url: 'https://via.placeholder.com/500x500?text=Leather+Jacket', isPrimary: true, sortOrder: 1 }
            ],
            variants: [
                { sku: 'LJ-M', variantName: 'Medium', price: 3999000, stock: 10, attributes: { size: 'M', color: 'Black' } },
                { sku: 'LJ-L', variantName: 'Large', price: 3999000, stock: 15, attributes: { size: 'L', color: 'Black' } },
                { sku: 'LJ-XL', variantName: 'X-Large', price: 3999000, stock: 8, attributes: { size: 'XL', color: 'Black' } }
            ]
        }
    ],

    systemSettings: [
        { key: 'site_name', value: 'FashionHub365', description: 'Website name' },
        { key: 'site_email', value: 'support@fashionhub365.com', description: 'Contact email' },
        { key: 'currency', value: 'VND', description: 'Default currency' },
        { key: 'tax_rate', value: '0.1', description: 'Default tax rate (10%)' }
    ]
};

// Main seed function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Clean database if flag is set
        if (shouldClean) {
            console.log('🧹 Cleaning existing data...');
            await Promise.all([
                Role.deleteMany({}),
                User.deleteMany({}),
                Brand.deleteMany({}),
                Category.deleteMany({}),
                Tag.deleteMany({}),
                Collection.deleteMany({}),
                Store.deleteMany({}),
                Product.deleteMany({}),
                SystemSetting.deleteMany({})
            ]);
            console.log('✅ Database cleaned\n');
        }

        // 1. Seed Roles (idempotent — upsert by slug)
        console.log('📝 Seeding Roles...');
        const roles = [];
        for (const roleData of seedData.roles) {
            const role = await Role.findOneAndUpdate(
                { slug: roleData.slug },
                { $set: roleData },
                { upsert: true, new: true }
            );
            roles.push(role);
        }
        console.log(`✅ Upserted ${roles.length} roles`);

        // 2. Seed Users with role references
        console.log('📝 Seeding Users...');
        const adminRole = roles.find(r => r.slug === 'admin');
        const storeOwnerRole = roles.find(r => r.slug === 'store-owner');
        const customerRole = roles.find(r => r.slug === 'customer');

        seedData.users[0].global_role_ids = [adminRole._id];
        seedData.users[1].global_role_ids = [storeOwnerRole._id];
        seedData.users[2].global_role_ids = [storeOwnerRole._id];
        seedData.users[3].global_role_ids = [customerRole._id];
        seedData.users[4].global_role_ids = [customerRole._id];

        const users = await User.insertMany(seedData.users);
        console.log(`✅ Created ${users.length} users`);

        // 3. Seed Brands
        console.log('📝 Seeding Brands...');
        const brands = await Brand.insertMany(seedData.brands);
        console.log(`✅ Created ${brands.length} brands`);

        // 4. Seed Categories (with parent references)
        console.log('📝 Seeding Categories...');
        const categoryMap = new Map();

        // First, create root categories
        for (const catData of seedData.categories.filter(c => !c.parent)) {
            const cat = await Category.create(catData);
            categoryMap.set(cat.name, cat);
        }

        // Then create child categories with parent references
        for (const catData of seedData.categories.filter(c => c.parent)) {
            const parentCat = categoryMap.get(catData.parent);
            const cat = await Category.create({
                ...catData,
                parent_id: parentCat ? parentCat._id : null
            });
            categoryMap.set(cat.name, cat);
        }

        console.log(`✅ Created ${categoryMap.size} categories`);

        // 5. Seed Tags
        console.log('📝 Seeding Tags...');
        const tags = await Tag.insertMany(seedData.tags);
        console.log(`✅ Created ${tags.length} tags`);

        // 6. Seed Collections
        console.log('📝 Seeding Collections...');
        const collections = await Collection.insertMany(seedData.collections);
        console.log(`✅ Created ${collections.length} collections`);

        // 7. Seed Stores
        console.log('📝 Seeding Stores...');
        const seller1 = users.find(u => u.username === 'seller1');
        const seller2 = users.find(u => u.username === 'seller2');

        seedData.stores[0].owner_user_id = seller1._id;
        seedData.stores[1].owner_user_id = seller2._id;

        const stores = await Store.insertMany(seedData.stores);
        console.log(`✅ Created ${stores.length} stores`);

        // 8. Seed Products
        console.log('📝 Seeding Products...');
        const nikeBrand = brands.find(b => b.name === 'Nike');
        const tshirtCategory = categoryMap.get('T-Shirts');
        const jeansCategory = categoryMap.get('Jeans');
        const sneakersCategory = categoryMap.get('Sneakers');
        const dressesCategory = categoryMap.get('Dresses');
        const jacketsCategory = categoryMap.get('Jackets');
        const summerCollection = collections.find(c => c.name === 'Summer 2026');
        const newArrivalTag = tags.find(t => t.name === 'New Arrival');
        const trendingTag = tags.find(t => t.name === 'Trending');

        // Assign relationships to products
        seedData.products[0].store_id = stores[0]._id;
        seedData.products[0].primary_category_id = tshirtCategory._id;
        seedData.products[0].category_ids = [tshirtCategory._id];
        seedData.products[0].tag_ids = [newArrivalTag._id];
        seedData.products[0].collection_ids = [summerCollection._id];

        seedData.products[1].store_id = stores[0]._id;
        seedData.products[1].primary_category_id = jeansCategory._id;
        seedData.products[1].category_ids = [jeansCategory._id];
        seedData.products[1].tag_ids = [trendingTag._id];

        seedData.products[2].store_id = stores[0]._id;
        seedData.products[2].brand_id = nikeBrand._id;
        seedData.products[2].primary_category_id = sneakersCategory._id;
        seedData.products[2].category_ids = [sneakersCategory._id];
        seedData.products[2].tag_ids = [newArrivalTag._id, trendingTag._id];

        seedData.products[3].store_id = stores[1]._id;
        seedData.products[3].primary_category_id = dressesCategory._id;
        seedData.products[3].category_ids = [dressesCategory._id];
        seedData.products[3].collection_ids = [summerCollection._id];
        seedData.products[3].tag_ids = [newArrivalTag._id];

        seedData.products[4].store_id = stores[1]._id;
        seedData.products[4].primary_category_id = jacketsCategory._id;
        seedData.products[4].category_ids = [jacketsCategory._id];

        const products = await Product.insertMany(seedData.products);
        console.log(`✅ Created ${products.length} products`);

        // 9. Seed System Settings
        console.log('📝 Seeding System Settings...');
        const settings = await SystemSetting.insertMany(seedData.systemSettings);
        console.log(`✅ Created ${settings.length} system settings`);

        console.log('\n🎉 Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Roles: ${roles.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Brands: ${brands.length}`);
        console.log(`   - Categories: ${categoryMap.size}`);
        console.log(`   - Tags: ${tags.length}`);
        console.log(`   - Collections: ${collections.length}`);
        console.log(`   - Stores: ${stores.length}`);
        console.log(`   - Products: ${products.length}`);
        console.log(`   - System Settings: ${settings.length}`);
        console.log('\n✨ Ready to use!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run the seeding
const run = async () => {
    try {
        await connectDB();
        await seedDatabase();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
