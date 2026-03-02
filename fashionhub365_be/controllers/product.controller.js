const Product = require('../models/Product');
const { validateProductData } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

/**
 * UC-09: Đăng bán sản phẩm
 * Tạo mới một sản phẩm với thông tin được cung cấp
 */
exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;

        // 1. Validate data
        const { isValid, errors } = validateProductData(productData);
        if (!isValid) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        // 2. Generate slug from name
        // Simple slug generation: lowercase, replace spaces with hyphens, remove special chars
        const baseSlug = productData.name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
        
        // Ensure slug uniqueness (simple implementation, improved in production with counter)
        let slug = baseSlug;
        let counter = 1;
        while (await Product.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 3. Create Product
        const newProduct = new Product({
            ...productData,
            slug,
            uuid: uuidv4(), // Explicitly setting UUID though default exists, good for clarity
            status: productData.status || 'draft' // Default to draft if not provided
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: 'Sản phẩm đã được tạo thành công.',
            product: savedProduct
        });

    } catch (error) {
        // Handle duplicate key checks if any slipped through
        if (error.code === 11000) {
             return res.status(400).json({
                message: 'Dữ liệu bị trùng lặp (ví dụ: slug hoặc tên sản phẩm đã tồn tại).',
                error: error.message
            });
        }
        res.status(500).json({
            message: 'Lỗi server khi tạo sản phẩm.',
            error: error.message
        });
    }
};

// UC-16: Lấy danh sách sản phẩm (tạm không cần auth)
exports.getSellerProducts = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [products, total] = await Promise.all([
            Product.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm.', error: error.message });
    }
};

// UC-16: Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy sản phẩm.', error: error.message });
    }
};

// UC-16: Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const { name, short_description, description, base_price, status, media, variants } = req.body;
        const updateData = { name, short_description, description, base_price, status, media, variants };

        // Cập nhật slug nếu tên thay đổi
        if (name) {
            const baseSlug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const existing = await Product.findOne({ slug: baseSlug, _id: { $ne: req.params.id } });
            updateData.slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        res.json({ message: 'Cập nhật sản phẩm thành công.', product });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm.', error: error.message });
    }
};

// UC-16: Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        res.json({ message: 'Xóa sản phẩm thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm.', error: error.message });
    }
};

// UC-16: Bật/tắt trạng thái hết hàng (active <-> inactive)
exports.toggleStockStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });

        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        product.status = newStatus;
        await product.save();

        res.json({ message: `Đã chuyển trạng thái sang "${newStatus}".`, product });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái.', error: error.message });
    }
};

