const Category = require('../models/Category');

const buildSlug = (rawName) => rawName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

// Get categories (supports search + includeDeleted for admin)
exports.getCategories = async (req, res) => {
    try {
        const { search, includeDeleted } = req.query;
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (String(includeDeleted).toLowerCase() !== 'true') {
            filter.deleted_at = null;
        }

        const categories = await Category.find(filter)
            .populate('parent_id', 'name')
            .sort({ created_at: -1 });

        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Error while fetching categories.', error: error.message });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const slug = buildSlug(name);
        let finalSlug = slug;
        let counter = 1;
        while (await Category.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter++}`;
        }

        const category = new Category({
            name: name.trim(),
            slug: finalSlug,
            description,
            parent_id: parent_id || null,
        });
        await category.save();
        return res.status(201).json({ message: 'Category created.', category });
    } catch (error) {
        return res.status(500).json({ message: 'Error while creating category.', error: error.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        const category = await Category.findOne({ _id: req.params.id, deleted_at: null });
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        if (description !== undefined) {
            category.description = description;
        }
        if (parent_id !== undefined) {
            category.parent_id = parent_id || null;
        }
        if (name?.trim()) {
            const normalizedName = name.trim();
            const slug = buildSlug(normalizedName);
            const existing = await Category.findOne({
                slug,
                _id: { $ne: req.params.id },
            });
            category.name = normalizedName;
            category.slug = existing ? `${slug}-${Date.now()}` : slug;
        }

        await category.save();
        return res.json({ message: 'Category updated.', category });
    } catch (error) {
        return res.status(500).json({ message: 'Error while updating category.', error: error.message });
    }
};

// Soft delete category
exports.deleteCategory = async (req, res) => {
    try {
        const children = await Category.countDocuments({
            parent_id: req.params.id,
            deleted_at: null,
        });
        if (children > 0) {
            return res.status(400).json({
                message: `Category has ${children} active child categories. Delete children first.`,
            });
        }

        const category = await Category.findOne({ _id: req.params.id, deleted_at: null });
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        category.deleted_at = new Date();
        await category.save();
        return res.json({ message: 'Category deleted (soft).' });
    } catch (error) {
        return res.status(500).json({ message: 'Error while deleting category.', error: error.message });
    }
};

// Restore soft-deleted category
exports.restoreCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, deleted_at: { $ne: null } });
        if (!category) {
            return res.status(404).json({ message: 'Deleted category not found.' });
        }

        category.deleted_at = null;
        await category.save();
        return res.json({ message: 'Category restored.', category });
    } catch (error) {
        return res.status(500).json({ message: 'Error while restoring category.', error: error.message });
    }
};
