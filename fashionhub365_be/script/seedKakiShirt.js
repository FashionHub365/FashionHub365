/**
 * seedKakiShirt.js
 * -------------------------------------------------------------------
 * Thêm 1 sản phẩm áo kaki nam với 3 màu (Kaki Vàng, Kaki Xanh Rêu, Kaki Đen)
 * Mỗi variant có image_url đúng màu lấy từ Unsplash.
 *
 * Usage:
 *   node script/seedKakiShirt.js
 * -------------------------------------------------------------------
 */

require('dotenv').config();
const connectDB = require('../config/db');
const { Product, Store, Category, Brand, Tag } = require('../models');
const { v4: uuidv4 } = require('uuid');

const KAKI_SHIRT = {
    slug: 'ao-kaki-nam-3-mau',
    name: 'Áo Kaki Nam Regular Fit',
    short_description: 'Áo kaki nam chất liệu cotton pha, form regular fit thoáng mát, 3 màu cơ bản',
    description: `Áo sơ mi kaki nam chất liệu cotton pha cao cấp (65% Cotton, 35% Polyester), 
co giãn nhẹ, thoáng mát, không nhàu. Thiết kế cổ bẻ, túi ngực, tay dài có thể xắn lên. 
Phù hợp mặc đi làm, đi chơi hoặc du lịch. Có 3 màu: Vàng Kaki cổ điển, Xanh Rêu Quân Đội và Đen Tuyền.`,
    base_price: 350000,
    CATEGORY_SLUG: 'tshirts',   // Men Clothing > T-Shirts (slug có trong seedData)
    BRAND_NAME: 'Uniqlo',
    TAGS: ['Best Seller', 'Trending'],
    sold_count: 312,
    view_count: 7840,
    rating: { average: 4.7, count: 198 },

    // ── Ảnh gallery chung (hiển thị trên card & detail) ─────────────
    media: [
        // Màu Vàng Kaki – ảnh chính (isPrimary)
        {
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop',
            isPrimary: true,
            sortOrder: 1
        },
        // Màu Xanh Rêu
        {
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
            isPrimary: false,
            sortOrder: 2
        },
        // Màu Đen
        {
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop',
            isPrimary: false,
            sortOrder: 3
        },
        // Ảnh lifestyle chung
        {
            mediaType: 'image',
            url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
            isPrimary: false,
            sortOrder: 4
        }
    ],

    // ── Variants – mỗi màu có image_url riêng đúng màu ─────────────
    variants: [
        // ── Màu: Kaki Vàng (Khaki / Beige) ─────────────────────────
        {
            sku: 'KKS-S-KHK',
            variantName: 'S / Kaki Vàng',
            price: 350000,
            stock: 40,
            image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop',
            attributes: { color: 'Kaki Vàng', size: 'S' },
            condition: 'new'
        },
        {
            sku: 'KKS-M-KHK',
            variantName: 'M / Kaki Vàng',
            price: 350000,
            stock: 60,
            image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop',
            attributes: { color: 'Kaki Vàng', size: 'M' },
            condition: 'new'
        },
        {
            sku: 'KKS-L-KHK',
            variantName: 'L / Kaki Vàng',
            price: 350000,
            stock: 45,
            image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop',
            attributes: { color: 'Kaki Vàng', size: 'L' },
            condition: 'new'
        },
        {
            sku: 'KKS-XL-KHK',
            variantName: 'XL / Kaki Vàng',
            price: 370000,
            stock: 30,
            image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop',
            attributes: { color: 'Kaki Vàng', size: 'XL' },
            condition: 'new'
        },

        // ── Màu: Xanh Rêu (Olive / Army Green) ─────────────────────
        {
            sku: 'KKS-S-OLV',
            variantName: 'S / Xanh Rêu',
            price: 350000,
            stock: 35,
            image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
            attributes: { color: 'Xanh Rêu', size: 'S' },
            condition: 'new'
        },
        {
            sku: 'KKS-M-OLV',
            variantName: 'M / Xanh Rêu',
            price: 350000,
            stock: 50,
            image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
            attributes: { color: 'Xanh Rêu', size: 'M' },
            condition: 'new'
        },
        {
            sku: 'KKS-L-OLV',
            variantName: 'L / Xanh Rêu',
            price: 350000,
            stock: 40,
            image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
            attributes: { color: 'Xanh Rêu', size: 'L' },
            condition: 'new'
        },
        {
            sku: 'KKS-XL-OLV',
            variantName: 'XL / Xanh Rêu',
            price: 370000,
            stock: 20,
            image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
            attributes: { color: 'Xanh Rêu', size: 'XL' },
            condition: 'new'
        },

        // ── Màu: Đen (Black) ────────────────────────────────────────
        {
            sku: 'KKS-S-BLK',
            variantName: 'S / Đen',
            price: 350000,
            stock: 30,
            image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop',
            attributes: { color: 'Đen', size: 'S' },
            condition: 'new'
        },
        {
            sku: 'KKS-M-BLK',
            variantName: 'M / Đen',
            price: 350000,
            stock: 55,
            image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop',
            attributes: { color: 'Đen', size: 'M' },
            condition: 'new'
        },
        {
            sku: 'KKS-L-BLK',
            variantName: 'L / Đen',
            price: 350000,
            stock: 38,
            image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop',
            attributes: { color: 'Đen', size: 'L' },
            condition: 'new'
        },
        {
            sku: 'KKS-XL-BLK',
            variantName: 'XL / Đen',
            price: 370000,
            stock: 22,
            image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop',
            attributes: { color: 'Đen', size: 'XL' },
            condition: 'new'
        },
    ]
};

// -------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------
const run = async () => {
    try {
        await connectDB();
        console.log('\n🌱 Seeding áo kaki nam...\n');

        // Lấy store active đầu tiên
        const store = await Store.findOne({ status: 'active' });
        if (!store) throw new Error('Không tìm thấy store active. Hãy chạy "npm run seed" trước.');
        console.log(`✅ Store: "${store.name}" (${store._id})\n`);

        // Kiểm tra sản phẩm đã tồn tại chưa
        const exists = await Product.findOne({ slug: KAKI_SHIRT.slug });
        if (exists) {
            console.log(`⏭️  Sản phẩm "${KAKI_SHIRT.name}" đã tồn tại (slug: ${KAKI_SHIRT.slug}), bỏ qua.`);
            process.exit(0);
        }

        // Map category
        const categories = await Category.find({});
        const catMap = Object.fromEntries(categories.map(c => [c.slug, c._id]));
        const catId = catMap[KAKI_SHIRT.CATEGORY_SLUG];
        if (!catId) throw new Error(`Không tìm thấy category slug: "${KAKI_SHIRT.CATEGORY_SLUG}". Hãy chạy seed gốc trước.`);

        // Map brand & tags
        const brands  = await Brand.find({});
        const tags    = await Tag.find({});
        const brandMap = Object.fromEntries(brands.map(b => [b.name, b._id]));
        const tagMap   = Object.fromEntries(tags.map(t => [t.name, t._id]));
        const brandId  = brandMap[KAKI_SHIRT.BRAND_NAME];
        const tagIds   = (KAKI_SHIRT.TAGS || []).map(t => tagMap[t]).filter(Boolean);

        // Tách các field helper ra khỏi object sản phẩm
        const { CATEGORY_SLUG, BRAND_NAME, TAGS, ...productData } = KAKI_SHIRT;

        const created = await Product.create({
            ...productData,
            uuid: uuidv4(),
            store_id: store._id,
            primary_category_id: catId,
            category_ids: [catId],
            brand_id: brandId || undefined,
            tag_ids: tagIds,
            status: 'active',
        });

        console.log(`✅ Đã thêm sản phẩm: "${created.name}"`);
        console.log(`   ID: ${created._id}`);
        console.log(`   Slug: ${created.slug}`);
        console.log(`   Màu sắc: Kaki Vàng, Xanh Rêu, Đen`);
        console.log(`   Số variants: ${created.variants.length}`);
        console.log(`   Category: ${KAKI_SHIRT.CATEGORY_SLUG} | Brand: ${KAKI_SHIRT.BRAND_NAME}`);
        console.log(`   sold_count: ${created.sold_count} | view_count: ${created.view_count} | rating: ${created.rating.average}⭐\n`);
        console.log('🎉 Xong!\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Lỗi:', err.message);
        process.exit(1);
    }
};

run();
