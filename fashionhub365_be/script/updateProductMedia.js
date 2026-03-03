/**
 * updateProductMedia.js
 * -------------------------------------------------------------------
 * Cập nhật media của các sản phẩm seedListingProducts
 * Thêm nhiều ảnh (1 ảnh/màu) để test tính năng đổi ảnh khi chọn màu
 * AN TOÀN: chỉ update sản phẩm có slug bắt đầu bằng "listing-"
 * -------------------------------------------------------------------
 * Cách dùng: node script/updateProductMedia.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const { Product } = require('../models');

// Map slug → mảng ảnh (thứ tự ảnh = thứ tự màu trong variants)
const MEDIA_MAP = {
    'listing-essential-tee-3color': [
        // Màu 1: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: White
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Red
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600', isPrimary: false, sortOrder: 2 },
    ],
    'listing-denim-straight-3color': [
        // Màu 1: Blue
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Brown
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', isPrimary: false, sortOrder: 2 },
    ],
    'listing-bomber-jacket-3color': [
        // Màu 1: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: Green
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1547956317-c3d9f8f56d8d?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Blue
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', isPrimary: false, sortOrder: 2 },
    ],
    'listing-wrap-dress-3color': [
        // Màu 1: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1566479179817-dc53d0f82d7e?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: Red
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Blue
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', isPrimary: false, sortOrder: 2 },
    ],
    'listing-retro-runner-3color': [
        // Màu 1: White
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Red
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', isPrimary: false, sortOrder: 2 },
    ],
    'listing-mini-skirt-3color': [
        // Màu 1: Black
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600', isPrimary: true, sortOrder: 0 },
        // Màu 2: White
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600', isPrimary: false, sortOrder: 1 },
        // Màu 3: Brown
        { mediaType: 'image', url: 'https://images.unsplash.com/photo-1562572159-4efd90232a62?w=600', isPrimary: false, sortOrder: 2 },
    ],
};

const run = async () => {
    try {
        await connectDB();
        console.log('\n📸 Bắt đầu cập nhật ảnh sản phẩm theo màu...\n');

        let updated = 0;
        let notFound = 0;

        for (const [slug, mediaList] of Object.entries(MEDIA_MAP)) {
            const product = await Product.findOne({ slug });

            if (!product) {
                console.log(`⚠️  Không tìm thấy: ${slug}`);
                notFound++;
                continue;
            }

            // Lấy tên các màu của sản phẩm này (theo thứ tự xuất hiện đầu tiên trong variants)
            const colorNames = [
                ...new Map(
                    product.variants
                        .filter(v => v.attributes?.color)
                        .map(v => [v.attributes.color, v.attributes.color])
                ).values()
            ];

            // Gán media mới
            product.media = mediaList;
            await product.save();

            console.log(`✅ Đã cập nhật: "${product.name}"`);
            console.log(`   Màu: ${colorNames.join(' / ')}`);
            console.log(`   Ảnh: ${mediaList.length} ảnh (1 ảnh/màu)`);
            updated++;
        }

        console.log('\n' + '─'.repeat(55));
        console.log(`🎉 Hoàn thành!  Cập nhật: ${updated}  |  Không tìm thấy: ${notFound}`);
        console.log('─'.repeat(55));
        console.log('\n💡 Cách hoạt động:');
        console.log('   - Click màu swatch thứ 1 → hiện ảnh sortOrder: 0');
        console.log('   - Click màu swatch thứ 2 → hiện ảnh sortOrder: 1');
        console.log('   - Click màu swatch thứ 3 → hiện ảnh sortOrder: 2\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Lỗi:', err.message);
        process.exit(1);
    }
};

run();
