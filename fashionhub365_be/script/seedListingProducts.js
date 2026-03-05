/**
 * seedListingProducts.js
 * -------------------------------------------------------------------
 * Mục đích : Thêm sản phẩm mẫu để test trang Listing (filter màu sắc, category, size)
 * An toàn  : Dùng slug để kiểm tra → KHÔNG ghi đè dữ liệu cũ của nhóm
 * Cách dùng:
 *   node script/seedListingProducts.js
 * -------------------------------------------------------------------
 */

require('dotenv').config();
const connectDB = require('../config/db');
const { Product, Store, Category, Brand, Tag } = require('../models');
const { v4: uuidv4 } = require('uuid');

// -------------------------------------------------------------------
// DỮ LIỆU SẢN PHẨM MẪU
// Mỗi sản phẩm có đúng 3 màu: Black / White / Red (hoặc Blue / Brown / Green)
// để test tính năng filter màu trên trang Listing
// -------------------------------------------------------------------
const PRODUCT_SAMPLES = [

    // ── T-SHIRTS ────────────────────────────────────────────────────
    {
        slug: 'listing-essential-tee-3color',
        name: 'Essential Cotton Tee',
        short_description: 'Áo thun cotton basic 3 màu cổ điển',
        description: 'Áo thun cotton 100% combed, form regular fit, thích hợp mặc hàng ngày. Có 3 màu cổ điển dễ phối đồ.',
        base_price: 320000,
        CATEGORY_SLUG: 'tshirts',
        BRAND_NAME: 'Uniqlo',
        TAGS: ['New Arrival', 'Best Seller'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-ECT-S-BLK', variantName: 'S / Black', price: 320000, stock: 40, attributes: { size: 'S', color: 'Black' } },
            { sku: 'LST-ECT-M-BLK', variantName: 'M / Black', price: 320000, stock: 60, attributes: { size: 'M', color: 'Black' } },
            { sku: 'LST-ECT-L-BLK', variantName: 'L / Black', price: 320000, stock: 50, attributes: { size: 'L', color: 'Black' } },
            { sku: 'LST-ECT-M-WHT', variantName: 'M / White', price: 320000, stock: 55, attributes: { size: 'M', color: 'White' } },
            { sku: 'LST-ECT-L-WHT', variantName: 'L / White', price: 320000, stock: 45, attributes: { size: 'L', color: 'White' } },
            { sku: 'LST-ECT-M-RED', variantName: 'M / Red', price: 320000, stock: 30, attributes: { size: 'M', color: 'Red' } },
            { sku: 'LST-ECT-L-RED', variantName: 'L / Red', price: 320000, stock: 25, attributes: { size: 'L', color: 'Red' } },
        ]
    },

    // ── JEANS ───────────────────────────────────────────────────────
    {
        slug: 'listing-denim-straight-3color',
        name: 'Straight Cut Denim Jeans',
        short_description: 'Quần jeans straight cut 3 màu denim phổ biến',
        description: 'Quần jeans form straight cut, chất liệu denim 320g bền chắc. 3 màu wash khác nhau phù hợp nhiều phong cách.',
        base_price: 750000,
        CATEGORY_SLUG: 'jeans',
        BRAND_NAME: 'Zara',
        TAGS: ['Trending'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-DSJ-30-BLU', variantName: '30 / Blue', price: 750000, stock: 20, attributes: { size: '30', color: 'Blue' } },
            { sku: 'LST-DSJ-32-BLU', variantName: '32 / Blue', price: 750000, stock: 35, attributes: { size: '32', color: 'Blue' } },
            { sku: 'LST-DSJ-34-BLU', variantName: '34 / Blue', price: 750000, stock: 28, attributes: { size: '34', color: 'Blue' } },
            { sku: 'LST-DSJ-32-BLK', variantName: '32 / Black', price: 770000, stock: 30, attributes: { size: '32', color: 'Black' } },
            { sku: 'LST-DSJ-34-BLK', variantName: '34 / Black', price: 770000, stock: 22, attributes: { size: '34', color: 'Black' } },
            { sku: 'LST-DSJ-32-BRN', variantName: '32 / Brown', price: 760000, stock: 18, attributes: { size: '32', color: 'Brown' } },
            { sku: 'LST-DSJ-34-BRN', variantName: '34 / Brown', price: 760000, stock: 15, attributes: { size: '34', color: 'Brown' } },
        ]
    },

    // ── JACKETS ─────────────────────────────────────────────────────
    {
        slug: 'listing-bomber-jacket-3color',
        name: 'Classic Bomber Jacket',
        short_description: 'Áo jacket bomber 3 màu đường phố',
        description: 'Bomber jacket vải nylon dù chống nước, lót bông mỏng ấm vừa đủ. Cổ len bo, tay bo, gấu bo đặc trưng bomber.',
        base_price: 890000,
        CATEGORY_SLUG: 'jackets',
        BRAND_NAME: 'Nike',
        TAGS: ['New Arrival', 'Trending'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-CBJ-S-BLK', variantName: 'S / Black', price: 890000, stock: 15, attributes: { size: 'S', color: 'Black' } },
            { sku: 'LST-CBJ-M-BLK', variantName: 'M / Black', price: 890000, stock: 20, attributes: { size: 'M', color: 'Black' } },
            { sku: 'LST-CBJ-L-BLK', variantName: 'L / Black', price: 890000, stock: 18, attributes: { size: 'L', color: 'Black' } },
            { sku: 'LST-CBJ-M-GRN', variantName: 'M / Green', price: 890000, stock: 12, attributes: { size: 'M', color: 'Green' } },
            { sku: 'LST-CBJ-L-GRN', variantName: 'L / Green', price: 890000, stock: 10, attributes: { size: 'L', color: 'Green' } },
            { sku: 'LST-CBJ-M-BLU', variantName: 'M / Blue', price: 890000, stock: 14, attributes: { size: 'M', color: 'Blue' } },
            { sku: 'LST-CBJ-L-BLU', variantName: 'L / Blue', price: 890000, stock: 11, attributes: { size: 'L', color: 'Blue' } },
        ]
    },

    // ── DRESSES ─────────────────────────────────────────────────────
    {
        slug: 'listing-wrap-dress-3color',
        name: 'Wrap Midi Dress',
        short_description: 'Váy wrap midi 3 màu nữ tính thanh lịch',
        description: 'Váy wrap midi tự buộc thắt lưng, chất liệu viscose mềm mại rủ đẹp, tôn dáng. Phù hợp đi làm và đi tiệc.',
        base_price: 1100000,
        CATEGORY_SLUG: 'dresses',
        BRAND_NAME: 'Zara',
        TAGS: ['New Arrival', 'Best Seller'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-WMD-XS-BLK', variantName: 'XS / Black', price: 1100000, stock: 10, attributes: { size: 'XS', color: 'Black' } },
            { sku: 'LST-WMD-S-BLK', variantName: 'S / Black', price: 1100000, stock: 18, attributes: { size: 'S', color: 'Black' } },
            { sku: 'LST-WMD-M-BLK', variantName: 'M / Black', price: 1100000, stock: 15, attributes: { size: 'M', color: 'Black' } },
            { sku: 'LST-WMD-S-RED', variantName: 'S / Red', price: 1100000, stock: 12, attributes: { size: 'S', color: 'Red' } },
            { sku: 'LST-WMD-M-RED', variantName: 'M / Red', price: 1100000, stock: 10, attributes: { size: 'M', color: 'Red' } },
            { sku: 'LST-WMD-S-BLU', variantName: 'S / Blue', price: 1100000, stock: 14, attributes: { size: 'S', color: 'Blue' } },
            { sku: 'LST-WMD-M-BLU', variantName: 'M / Blue', price: 1100000, stock: 12, attributes: { size: 'M', color: 'Blue' } },
        ]
    },

    // ── SNEAKERS ────────────────────────────────────────────────────
    {
        slug: 'listing-retro-runner-3color',
        name: 'Retro Runner Sneakers',
        short_description: 'Giày sneaker retro runner 3 màu cổ điển',
        description: 'Giày sneaker phong cách retro runner, đế EVA êm nhẹ, upper mesh thoáng khí. 3 phiên bản màu cổ điển.',
        base_price: 1850000,
        CATEGORY_SLUG: 'sneakers',
        BRAND_NAME: 'Adidas',
        TAGS: ['Trending', 'Best Seller'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-RRS-39-WHT', variantName: 'EU 39 / White', price: 1850000, stock: 15, attributes: { size: '39', color: 'White' } },
            { sku: 'LST-RRS-40-WHT', variantName: 'EU 40 / White', price: 1850000, stock: 20, attributes: { size: '40', color: 'White' } },
            { sku: 'LST-RRS-41-WHT', variantName: 'EU 41 / White', price: 1850000, stock: 18, attributes: { size: '41', color: 'White' } },
            { sku: 'LST-RRS-40-BLK', variantName: 'EU 40 / Black', price: 1850000, stock: 16, attributes: { size: '40', color: 'Black' } },
            { sku: 'LST-RRS-41-BLK', variantName: 'EU 41 / Black', price: 1850000, stock: 14, attributes: { size: '41', color: 'Black' } },
            { sku: 'LST-RRS-40-RED', variantName: 'EU 40 / Red', price: 1900000, stock: 10, attributes: { size: '40', color: 'Red' } },
            { sku: 'LST-RRS-41-RED', variantName: 'EU 41 / Red', price: 1900000, stock: 8, attributes: { size: '41', color: 'Red' } },
        ]
    },

    // ── SKIRTS ──────────────────────────────────────────────────────
    {
        slug: 'listing-mini-skirt-3color',
        name: 'Flare Mini Skirt',
        short_description: 'Chân váy mini xòe 3 màu trẻ trung năng động',
        description: 'Chân váy mini xòe dáng A-line, chất liệu tweed pha sợi, nhẹ và không nhăn. 3 màu dễ phối với áo thun hoặc áo sơ mi.',
        base_price: 480000,
        CATEGORY_SLUG: 'skirts',
        BRAND_NAME: 'H&M',
        TAGS: ['New Arrival', 'Trending'],
        media: [
            { mediaType: 'image', url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500', isPrimary: true, sortOrder: 1 }
        ],
        variants: [
            { sku: 'LST-FMS-XS-BLK', variantName: 'XS / Black', price: 480000, stock: 20, attributes: { size: 'XS', color: 'Black' } },
            { sku: 'LST-FMS-S-BLK', variantName: 'S / Black', price: 480000, stock: 28, attributes: { size: 'S', color: 'Black' } },
            { sku: 'LST-FMS-M-BLK', variantName: 'M / Black', price: 480000, stock: 22, attributes: { size: 'M', color: 'Black' } },
            { sku: 'LST-FMS-S-WHT', variantName: 'S / White', price: 480000, stock: 18, attributes: { size: 'S', color: 'White' } },
            { sku: 'LST-FMS-M-WHT', variantName: 'M / White', price: 480000, stock: 15, attributes: { size: 'M', color: 'White' } },
            { sku: 'LST-FMS-S-BRN', variantName: 'S / Brown', price: 480000, stock: 12, attributes: { size: 'S', color: 'Brown' } },
            { sku: 'LST-FMS-M-BRN', variantName: 'M / Brown', price: 480000, stock: 10, attributes: { size: 'M', color: 'Brown' } },
        ]
    },
];

// -------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------
const run = async () => {
    try {
        await connectDB();
        console.log('\n🌱 Bắt đầu thêm sản phẩm mẫu cho trang Listing...\n');

        // Tìm store đang active
        const store = await Store.findOne({ status: 'active' });
        if (!store) {
            throw new Error('Không tìm thấy store active. Hãy chạy "npm run seed" trước.');
        }
        console.log(`✅ Store: "${store.name}" (${store._id})`);

        // Tạo map category / brand / tag
        const categories = await Category.find({});
        const brands = await Brand.find({});
        const tags = await Tag.find({});

        const catMap = Object.fromEntries(categories.map(c => [c.slug, c._id]));
        const brandMap = Object.fromEntries(brands.map(b => [b.name, b._id]));
        const tagMap = Object.fromEntries(tags.map(t => [t.name, t._id]));

        let added = 0, skipped = 0;

        for (const sample of PRODUCT_SAMPLES) {
            // Kiểm tra slug đã tồn tại chưa → an toàn với dữ liệu cũ
            const exists = await Product.findOne({ slug: sample.slug });
            if (exists) {
                console.log(`⏭️  Đã tồn tại, bỏ qua: ${sample.name}`);
                skipped++;
                continue;
            }

            const catId = catMap[sample.CATEGORY_SLUG];
            if (!catId) {
                console.log(`⚠️  Category "${sample.CATEGORY_SLUG}" không tìm thấy → bỏ qua: ${sample.name}`);
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

            // Đếm số màu duy nhất để log rõ
            const colors = [...new Set(sample.variants.map(v => v.attributes.color))];
            console.log(`✅ Đã thêm: "${sample.name}" | Màu: ${colors.join(', ')} | ${sample.variants.length} variants`);
            added++;
        }

        console.log('\n' + '─'.repeat(55));
        console.log(`🎉 Hoàn thành!  Thêm: ${added}  |  Bỏ qua: ${skipped}`);
        console.log('─'.repeat(55) + '\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Lỗi:', err.message);
        process.exit(1);
    }
};

run();
