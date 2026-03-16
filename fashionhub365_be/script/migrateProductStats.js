/**
 * Migration Script: Backfill sold_count, view_count, rating cho các sản phẩm cũ
 *
 * Chạy 1 lần duy nhất:
 *   node script/migrateProductStats.js
 *
 * An toàn để chạy nhiều lần ($set chỉ ghi đè nếu field chưa có giá trị hợp lệ)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionhub365';

async function migrate() {
    console.log('🔗 Kết nối MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công\n');

    // Tìm tất cả SP chưa có field sold_count HOẶC sold_count là null/undefined
    const result = await Product.updateMany(
        {
            $or: [
                { sold_count: { $exists: false } },
                { sold_count: null },
                { view_count: { $exists: false } },
                { view_count: null },
                { 'rating.average': { $exists: false } },
            ]
        },
        {
            $set: {
                sold_count: 0,
                view_count: 0,
                'rating.average': 0,
                'rating.count': 0,
            }
        }
    );

    console.log(`📦 Đã cập nhật: ${result.modifiedCount} sản phẩm`);
    console.log(`📋 Không thay đổi: ${result.matchedCount - result.modifiedCount} sản phẩm (đã có field)`);

    // Kiểm tra lại
    const total = await Product.countDocuments();
    const withStats = await Product.countDocuments({
        sold_count: { $exists: true },
        view_count: { $exists: true },
    });

    console.log(`\n📊 Tổng kiểm tra:`);
    console.log(`   Tổng sản phẩm:           ${total}`);
    console.log(`   Có đủ stats fields:      ${withStats}`);
    console.log(`   Thiếu stats fields:      ${total - withStats}`);

    if (total - withStats === 0) {
        console.log('\n🎉 Migration hoàn tất! Tất cả sản phẩm đã có field stats.');
    } else {
        console.log('\n⚠️  Vẫn còn sản phẩm chưa được cập nhật. Kiểm tra lại.');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Đã đóng kết nối MongoDB.');
}

migrate().catch((err) => {
    console.error('❌ Lỗi migration:', err.message);
    process.exit(1);
});
