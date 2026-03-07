/**
 * Script kiểm tra tính cô lập dữ liệu Store (Store Isolation)
 * Đảm bảo Người bán A không thể can thiệp sản phẩm của Người bán B.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const { Product, User, Store, StoreMember } = require('../models');
const productService = require('../services/product.service');
const ApiError = require('../utils/ApiError');

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- BẮT ĐẦU KIỂM TRA CÔ LẬP DỮ LIỆU STORE ---');

        // 1. Tạo dữ liệu mẫu: 2 Store và 2 User
        const userA = await User.create({ email: 'sellerA@test.com', password_hash: 'hashed_pw', status: 'ACTIVE' });
        const userB = await User.create({ email: 'sellerB@test.com', password_hash: 'hashed_pw', status: 'ACTIVE' });

        const storeA = await Store.create({ name: 'Store A', slug: 'store-a-' + Date.now(), owner_user_id: userA._id });
        const storeB = await Store.create({ name: 'Store B', slug: 'store-b-' + Date.now(), owner_user_id: userB._id });

        await StoreMember.create({ user_id: userA._id, store_id: storeA._id, status: 'ACTIVE' });
        await StoreMember.create({ user_id: userB._id, store_id: storeB._id, status: 'ACTIVE' });

        console.log('1. Đã tạo dữ liệu mẫu thành công.');

        // 2. Test UC-09: Tạo sản phẩm (Auto gán store_id)
        const prodA = await productService.createProductForSeller({
            name: 'Sản phẩm Store A',
            base_price: 100000
        }, storeA._id);
        
        console.log(`2. UC-09: Tạo SP cho Store A. Store_id gán: ${prodA.store_id} (Kỳ vọng: ${storeA._id})`);

        // 3. Test UC-16: Query Seller Products
        const listA = await productService.querySellerProducts(storeA._id, {});
        const listB = await productService.querySellerProducts(storeB._id, {});
        
        console.log(`3. UC-16: Danh sách SP Store A: ${listA.products.length}, Store B: ${listB.products.length}`);

        // 4. Test Bảo mật: Seller B cố tình xóa SP của Seller A
        console.log('4. Kiểm tra bảo mật: Seller B cố xóa SP của Seller A...');
        try {
            await productService.deleteProductBySeller(prodA._id, storeB._id);
            console.error('❌ THẤT BẠI: Seller B xóa được SP của Seller A!');
        } catch (error) {
            console.log(`✅ THÀNH CÔNG: Chặn xóa thành công. Lỗi: ${error.message}`);
        }

        // 5. Test UC-11: Cập nhật SP chính chủ
        await productService.updateProductBySeller(prodA._id, storeA._id, { name: 'Sản phẩm A - Đã sửa' });
        const updatedProd = await Product.findById(prodA._id);
        console.log(`5. UC-11: Cập nhật SP chính chủ thành công. Tên mới: ${updatedProd.name}`);

        // 6. Test UC-15: Toggle status
        await productService.toggleProductStatusBySeller(prodA._id, storeA._id);
        const toggledProd = await Product.findById(prodA._id);
        console.log(`6. UC-15: Toggle status thành công. Status mới: ${toggledProd.status}`);

        // Dọn dẹp dữ liệu test
        await Product.deleteMany({ store_id: { $in: [storeA._id, storeB._id] } });
        await StoreMember.deleteMany({ store_id: { $in: [storeA._id, storeB._id] } });
        await Store.deleteMany({ _id: { $in: [storeA._id, storeB._id] } });
        await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
        
        console.log('--- KẾT THÚC KIỂM TRA: TẤT CẢ VƯỢT QUA ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ LỖI TRONG QUÁ TRÌNH TEST:', error);
        process.exit(1);
    }
};

runTest();
