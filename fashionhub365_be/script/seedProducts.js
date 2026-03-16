/**
 * seedProducts.js
 * -------------------------------------------------------------------
 * Seeds 6 new products (all English) for the FashionHub365 listing page.
 * Includes sold_count, view_count, rating for best_sellers / top_rated sorting.
 *
 * Usage:
 *   node script/seedProducts.js
 * -------------------------------------------------------------------
 */

require('dotenv').config();
const connectDB = require('../config/db');
const { Product, Store, Category, Brand, Tag } = require('../models');
const { v4: uuidv4 } = require('uuid');

const PRODUCT_SAMPLES = [

    // ── 1. JEANS ────────────────────────────────────────────────────
    {
        slug: 'v2-slim-fit-jeans-3color',
        name: 'Slim Fit Stretch Jeans',
        short_description: 'Classic slim fit jeans with stretch comfort in 3 colors',
        description: 'Crafted from premium stretch denim (98% cotton, 2% elastane), these slim fit jeans offer all-day comfort without sacrificing style. Available in three versatile washes.',
        base_price: 850000,
        CATEGORY_SLUG: 'jeans',
        BRAND_NAME: 'Zara',
        TAGS: ['Best Seller', 'Trending'],
        sold_count: 142,
        view_count: 3210,
        rating: { average: 4.6, count: 89 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-SFJ-30-BLU', variantName: '30 / Blue', price: 850000, stock: 25, attributes: { size: '30', color: 'Blue' } },
            { sku: 'V2-SFJ-32-BLU', variantName: '32 / Blue', price: 850000, stock: 30, attributes: { size: '32', color: 'Blue' } },
            { sku: 'V2-SFJ-34-BLU', variantName: '34 / Blue', price: 850000, stock: 20, attributes: { size: '34', color: 'Blue' } },
            { sku: 'V2-SFJ-32-BLK', variantName: '32 / Black', price: 870000, stock: 28, attributes: { size: '32', color: 'Black' } },
            { sku: 'V2-SFJ-34-BLK', variantName: '34 / Black', price: 870000, stock: 18, attributes: { size: '34', color: 'Black' } },
            { sku: 'V2-SFJ-32-GRY', variantName: '32 / Grey', price: 860000, stock: 15, attributes: { size: '32', color: 'Grey' } },
            { sku: 'V2-SFJ-34-GRY', variantName: '34 / Grey', price: 860000, stock: 12, attributes: { size: '34', color: 'Grey' } },
        ]
    },

    // ── 2. JACKETS ──────────────────────────────────────────────────
    {
        slug: 'v2-puffer-jacket-3color',
        name: 'Lightweight Puffer Jacket',
        short_description: 'Water-resistant puffer jacket with packable design',
        description: 'This ultra-lightweight puffer jacket is filled with 90/10 down and features a DWR water-resistant shell. Packable into its own chest pocket for easy storage on the go.',
        base_price: 1450000,
        CATEGORY_SLUG: 'jackets',
        BRAND_NAME: 'Nike',
        TAGS: ['New Arrival', 'Best Seller'],
        sold_count: 98,
        view_count: 2760,
        rating: { average: 4.8, count: 62 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-PFJ-S-BLK', variantName: 'S / Black', price: 1450000, stock: 18, attributes: { size: 'S', color: 'Black' } },
            { sku: 'V2-PFJ-M-BLK', variantName: 'M / Black', price: 1450000, stock: 22, attributes: { size: 'M', color: 'Black' } },
            { sku: 'V2-PFJ-L-BLK', variantName: 'L / Black', price: 1450000, stock: 15, attributes: { size: 'L', color: 'Black' } },
            { sku: 'V2-PFJ-M-NAV', variantName: 'M / Navy', price: 1450000, stock: 20, attributes: { size: 'M', color: 'Navy' } },
            { sku: 'V2-PFJ-L-NAV', variantName: 'L / Navy', price: 1450000, stock: 14, attributes: { size: 'L', color: 'Navy' } },
            { sku: 'V2-PFJ-M-OLV', variantName: 'M / Green', price: 1450000, stock: 10, attributes: { size: 'M', color: 'Green' } },
            { sku: 'V2-PFJ-L-OLV', variantName: 'L / Green', price: 1450000, stock: 8, attributes: { size: 'L', color: 'Green' } },
        ]
    },

    // ── 3. SNEAKERS ─────────────────────────────────────────────────
    {
        slug: 'v2-low-top-sneaker-3color',
        name: 'Low-Top Canvas Sneakers',
        short_description: 'Minimalist low-top canvas sneakers in 3 classic colorways',
        description: 'These clean, minimalist sneakers feature a premium canvas upper, cushioned insole, and vulcanized rubber outsole for lasting durability. A timeless wardrobe staple.',
        base_price: 1200000,
        CATEGORY_SLUG: 'sneakers',
        BRAND_NAME: 'Adidas',
        TAGS: ['Trending', 'Best Seller'],
        sold_count: 215,
        view_count: 5480,
        rating: { average: 4.7, count: 134 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-LTS-39-WHT', variantName: 'EU 39 / White', price: 1200000, stock: 20, attributes: { size: '39', color: 'White' } },
            { sku: 'V2-LTS-40-WHT', variantName: 'EU 40 / White', price: 1200000, stock: 28, attributes: { size: '40', color: 'White' } },
            { sku: 'V2-LTS-41-WHT', variantName: 'EU 41 / White', price: 1200000, stock: 22, attributes: { size: '41', color: 'White' } },
            { sku: 'V2-LTS-40-BLK', variantName: 'EU 40 / Black', price: 1200000, stock: 18, attributes: { size: '40', color: 'Black' } },
            { sku: 'V2-LTS-41-BLK', variantName: 'EU 41 / Black', price: 1200000, stock: 15, attributes: { size: '41', color: 'Black' } },
            { sku: 'V2-LTS-40-NAV', variantName: 'EU 40 / Navy', price: 1200000, stock: 12, attributes: { size: '40', color: 'Navy' } },
            { sku: 'V2-LTS-41-NAV', variantName: 'EU 41 / Navy', price: 1200000, stock: 10, attributes: { size: '41', color: 'Navy' } },
        ]
    },

    // ── 4. BOOTS ────────────────────────────────────────────────────
    {
        slug: 'v2-chelsea-boot-3color',
        name: 'Classic Chelsea Boots',
        short_description: 'Genuine leather Chelsea boots with elastic side panels',
        description: 'Handcrafted from full-grain leather, these Chelsea boots feature a pull tab, elastic side panels, and a sturdy stacked heel. Perfect for both casual and smart-casual outfits.',
        base_price: 2200000,
        CATEGORY_SLUG: 'boots',
        BRAND_NAME: 'Zara',
        TAGS: ['New Arrival', 'Trending'],
        sold_count: 67,
        view_count: 1890,
        rating: { average: 4.5, count: 41 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-CCB-40-BRN', variantName: 'EU 40 / Brown', price: 2200000, stock: 10, attributes: { size: '40', color: 'Brown' } },
            { sku: 'V2-CCB-41-BRN', variantName: 'EU 41 / Brown', price: 2200000, stock: 14, attributes: { size: '41', color: 'Brown' } },
            { sku: 'V2-CCB-42-BRN', variantName: 'EU 42 / Brown', price: 2200000, stock: 12, attributes: { size: '42', color: 'Brown' } },
            { sku: 'V2-CCB-40-BLK', variantName: 'EU 40 / Black', price: 2200000, stock: 16, attributes: { size: '40', color: 'Black' } },
            { sku: 'V2-CCB-41-BLK', variantName: 'EU 41 / Black', price: 2200000, stock: 18, attributes: { size: '41', color: 'Black' } },
            { sku: 'V2-CCB-41-TAN', variantName: 'EU 41 / Tan', price: 2200000, stock: 8, attributes: { size: '41', color: 'Tan' } },
            { sku: 'V2-CCB-42-TAN', variantName: 'EU 42 / Tan', price: 2200000, stock: 6, attributes: { size: '42', color: 'Tan' } },
        ]
    },

    // ── 5. MEN ACCESSORIES ──────────────────────────────────────────
    {
        slug: 'v2-leather-belt-3color',
        name: 'Full-Grain Leather Belt',
        short_description: 'Handstitched full-grain leather belt in 3 classic tones',
        description: 'Made from full-grain cowhide leather with a silver-tone pin buckle. Each belt is edge-painted and stitched for durability. Available in three widths and three colors.',
        base_price: 480000,
        CATEGORY_SLUG: 'men-accessories',
        BRAND_NAME: 'Uniqlo',
        TAGS: ['Best Seller'],
        sold_count: 183,
        view_count: 2940,
        rating: { average: 4.4, count: 97 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1616150638538-a7d9e1c1e6cf?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-FGB-S-BRN', variantName: 'S / Brown', price: 480000, stock: 30, attributes: { size: 'S', color: 'Brown' } },
            { sku: 'V2-FGB-M-BRN', variantName: 'M / Brown', price: 480000, stock: 40, attributes: { size: 'M', color: 'Brown' } },
            { sku: 'V2-FGB-L-BRN', variantName: 'L / Brown', price: 480000, stock: 25, attributes: { size: 'L', color: 'Brown' } },
            { sku: 'V2-FGB-S-BLK', variantName: 'S / Black', price: 480000, stock: 35, attributes: { size: 'S', color: 'Black' } },
            { sku: 'V2-FGB-M-BLK', variantName: 'M / Black', price: 480000, stock: 45, attributes: { size: 'M', color: 'Black' } },
            { sku: 'V2-FGB-M-TAN', variantName: 'M / Tan', price: 490000, stock: 20, attributes: { size: 'M', color: 'Tan' } },
            { sku: 'V2-FGB-L-TAN', variantName: 'L / Tan', price: 490000, stock: 15, attributes: { size: 'L', color: 'Tan' } },
        ]
    },

    // ── 6. JACKETS (2nd — Outerwear) ─────────────────────────────────
    {
        slug: 'v2-trench-coat-3color',
        name: 'Classic Trench Coat',
        short_description: 'Timeless double-breasted trench coat in 3 neutral tones',
        description: 'A wardrobe icon reimagined for modern life. This trench coat features a double-breasted front, storm flap, and belted waist in a water-repellent gabardine fabric.',
        base_price: 2800000,
        CATEGORY_SLUG: 'jackets',
        BRAND_NAME: 'Zara',
        TAGS: ['New Arrival', 'Trending'],
        sold_count: 54,
        view_count: 4120,
        rating: { average: 4.9, count: 38 },
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600', isPrimary: true, sortOrder: 1 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600', isPrimary: false, sortOrder: 2 },
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600', isPrimary: false, sortOrder: 3 },
        ],
        variants: [
            { sku: 'V2-TRC-S-BEI', variantName: 'S / Beige', price: 2800000, stock: 8, attributes: { size: 'S', color: 'Beige' } },
            { sku: 'V2-TRC-M-BEI', variantName: 'M / Beige', price: 2800000, stock: 12, attributes: { size: 'M', color: 'Beige' } },
            { sku: 'V2-TRC-L-BEI', variantName: 'L / Beige', price: 2800000, stock: 10, attributes: { size: 'L', color: 'Beige' } },
            { sku: 'V2-TRC-M-BLK', variantName: 'M / Black', price: 2800000, stock: 14, attributes: { size: 'M', color: 'Black' } },
            { sku: 'V2-TRC-L-BLK', variantName: 'L / Black', price: 2800000, stock: 10, attributes: { size: 'L', color: 'Black' } },
            { sku: 'V2-TRC-M-NAV', variantName: 'M / Navy', price: 2800000, stock: 9, attributes: { size: 'M', color: 'Navy' } },
            { sku: 'V2-TRC-L-NAV', variantName: 'L / Navy', price: 2800000, stock: 7, attributes: { size: 'L', color: 'Navy' } },
        ]
    },
];

// -------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------
const run = async () => {
    try {
        await connectDB();
        console.log('\n🌱 Seeding 6 new products (English)...\n');

        const store = await Store.findOne({ status: 'active' });
        if (!store) throw new Error('No active store found. Run "npm run seed" first.');
        console.log(`✅ Store: "${store.name}" (${store._id})\n`);

        const categories = await Category.find({});
        const brands = await Brand.find({});
        const tags = await Tag.find({});

        const catMap = Object.fromEntries(categories.map(c => [c.slug, c._id]));
        const brandMap = Object.fromEntries(brands.map(b => [b.name, b._id]));
        const tagMap = Object.fromEntries(tags.map(t => [t.name, t._id]));

        let added = 0, skipped = 0;

        for (const sample of PRODUCT_SAMPLES) {
            const exists = await Product.findOne({ slug: sample.slug });
            if (exists) {
                console.log(`⏭️  Already exists, skipping: ${sample.name}`);
                skipped++;
                continue;
            }

            const catId = catMap[sample.CATEGORY_SLUG];
            if (!catId) {
                console.log(`⚠️  Category "${sample.CATEGORY_SLUG}" not found → skipping: ${sample.name}`);
                skipped++;
                continue;
            }

            const brandId = brandMap[sample.BRAND_NAME];
            const tagIds = (sample.TAGS || []).map(t => tagMap[t]).filter(Boolean);

            const { CATEGORY_SLUG, BRAND_NAME, TAGS, ...rest } = sample;

            await Product.create({
                ...rest,
                uuid: uuidv4(),
                store_id: store._id,
                primary_category_id: catId,
                category_ids: [catId],
                brand_id: brandId || undefined,
                tag_ids: tagIds,
                status: 'active',
            });

            const colors = [...new Set(sample.variants.map(v => v.attributes.color))];
            console.log(`✅ Added: "${sample.name}"`);
            console.log(`   Category: ${sample.CATEGORY_SLUG} | Colors: ${colors.join(', ')}`);
            console.log(`   sold_count: ${sample.sold_count} | view_count: ${sample.view_count} | rating: ${sample.rating.average}⭐ (${sample.rating.count} reviews)\n`);
            added++;
        }

        console.log('─'.repeat(55));
        console.log(`🎉 Done!  Added: ${added}  |  Skipped: ${skipped}`);
        console.log('─'.repeat(55) + '\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
};

run();
