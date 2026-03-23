const { Product, Store, Category } = require('../models');

/**
 * Service to retrieve relevant business data for AI context.
 */
const dataRetrievalService = {
    /**
     * Search for products and stores based on keywords.
     * @param {string} query 
     * @returns {Promise<string>} Formatted text context
     */
    getRelevantContext: async (query) => {
        try {
            console.log(`[DataRetrieval] Searching for: ${query}`);
            if (!query) return "";

            // 1. Phân tích ngữ cảnh: Lọc bỏ các từ stop-words phổ biến trong tiếng Việt để ra từ khóa tìm kiếm
            const isTopRequest = query.toLowerCase().includes('bán chạy') || query.toLowerCase().includes('hot');
            
            // Lọc từ khóa
            const stopWords = ['có', 'không', 'cho', 'hỏi', 'tôi', 'bạn', 'muốn', 'mua', 'anh', 'em', 'nhé', 'ạ', 'shop', 'ơi', 'tìm', 'cái', 'những', 'một', 'vài', 'đang', 'cần'];
            const searchWords = query.toLowerCase().replace(/[?,.!]/g, '').split(' ')
                .filter(w => w.length >= 2 && !stopWords.includes(w));

            let productQuery = { status: 'active' };
            
            if (isTopRequest) {
                // Khách hỏi đồ bán chạy
                productQuery = { status: 'active' };
            } else if (searchWords.length > 0) {
                // Khách tìm món đồ cụ thể (ví dụ: "áo", "quần", "y2k")
                const regexQueries = searchWords.map(w => ({
                    $or: [
                        { name: { $regex: w, $options: 'i' } },
                        { short_description: { $regex: w, $options: 'i' } },
                        { description: { $regex: w, $options: 'i' } }
                    ]
                }));
                productQuery = { $or: regexQueries, status: 'active' };
            } else {
                productQuery = {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ],
                    status: 'active'
                };
            }

            const products = await Product.find(productQuery)
                .sort({ sold_count: -1 })
                .limit(5)
                .populate('store_id', 'name slug')
                .lean();
            console.log(`[DataRetrieval] Products found: ${products.length}`);

            // 2. Search for stores matching the query
            const stores = await Store.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ],
                status: 'active'
            })
                .limit(3)
                .lean();

            // 3. Format into a string for the AI
            let context = "DƯỚI ĐÂY LÀ DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG FASHIONHUB365 (Hãy dùng thông tin này để trả lời):\n\n";

            if (products.length > 0) {
                const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
                context += "--- DANH SÁCH SẢN PHẨM LIÊN QUAN ---\n";
                context += "(Để hiển thị thẻ sản phẩm hãy dùng ĐÚNG định dạng: {{PRODUCT_CARD|Tên|Giá|productId|Link_Ảnh}})\n\n";
                products.forEach((p, i) => {
                    let image = p.media?.find(m => m.isPrimary)?.url || (p.media?.[0]?.url) || '';
                    if (image && !image.startsWith('http')) {
                        image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
                    }
                    // Use _id (not slug) to ensure reliable product navigation
                    context += `${i + 1}. Tên: ${p.name}\n   Giá: ${p.base_price.toLocaleString('vi-VN')} VNĐ\n   ID: ${p._id}\n   Ảnh: ${image}\n   Định dạng thẻ: {{PRODUCT_CARD|${p.name}|${p.base_price.toLocaleString('vi-VN')} VNĐ|${p._id}|${image}}}\n\n`;
                });
            }

            if (stores.length > 0) {
                context += "--- CỬA HÀNG LIÊN QUAN ---\n";
                stores.forEach((s, i) => {
                    context += `${i + 1}. Tên Shop: ${s.name}\n   Mô tả: ${s.description || 'Không có mô tả'}\n   Link: /store/${s.slug}\n\n`;
                });
            }

            if (products.length === 0 && stores.length === 0) {
                // FALLBACK: If nothing specific found, return featured/top products
                const featured = await Product.find({ status: 'active' })
                    .sort({ sold_count: -1 })
                    .limit(3)
                    .populate('store_id', 'name')
                    .lean();

                if (featured.length > 0) {
                    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
                    context += "--- SẢN PHẨM NỔI BẬT (Gợi ý cho bạn): ---\n";
                    context += "(Hãy dùng định dạng thẻ sản phẩm bên dưới để hiển thị sản phẩm)\n\n";
                    featured.forEach((p, i) => {
                        let image = p.media?.find(m => m.isPrimary)?.url || (p.media?.[0]?.url) || '';
                        if (image && !image.startsWith('http')) {
                            image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
                        }
                        context += `${i + 1}. ${p.name} - Giá: ${p.base_price.toLocaleString('vi-VN')} VNĐ\n   Định dạng thẻ: {{PRODUCT_CARD|${p.name}|${p.base_price.toLocaleString('vi-VN')} VNĐ|${p._id}|${image}}}\n\n`;
                    });
                    return context;
                }
                return "Hệ thống hiện chưa có sản phẩm nào được đăng tải.";
            }

            return context;
        } catch (error) {
            console.error("[DataRetrieval] Error:", error.message);
            return "Đã có lỗi khi truy xuất dữ liệu từ hệ thống.";
        }
    }
};

module.exports = dataRetrievalService;
