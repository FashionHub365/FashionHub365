const Category = require('../models/Category');

// Lấy tất cả danh mục (có hỗ trợ search)
exports.getCategories = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
        const categories = await Category.find(filter)
            .populate('parent_id', 'name')
            .sort({ created_at: -1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh mục.', error: error.message });
    }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Tên danh mục không được để trống.' });

        const slug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // bỏ dấu
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');

        // Đảm bảo slug unique
        let finalSlug = slug;
        let counter = 1;
        while (await Category.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter++}`;
        }

        const category = new Category({ name: name.trim(), slug: finalSlug, description, parent_id: parent_id || null });
        await category.save();
        res.status(201).json({ message: 'Tạo danh mục thành công.', category });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo danh mục.', error: error.message });
    }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        const updateData = { description };
        if (name?.trim()) {
            updateData.name = name.trim();
            const slug = name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
            const existing = await Category.findOne({ slug, _id: { $ne: req.params.id } });
            updateData.slug = existing ? `${slug}-${Date.now()}` : slug;
        }
        if (parent_id !== undefined) updateData.parent_id = parent_id || null;

        const category = await Category.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        res.json({ message: 'Cập nhật danh mục thành công.', category });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật danh mục.', error: error.message });
    }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
    try {
        // Kiểm tra có danh mục con không
        const children = await Category.countDocuments({ parent_id: req.params.id });
        if (children > 0) return res.status(400).json({ message: `Danh mục này có ${children} danh mục con. Xóa danh mục con trước.` });

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        res.json({ message: 'Xóa danh mục thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa danh mục.', error: error.message });
    }
};
