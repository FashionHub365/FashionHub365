const cloudinary = require('../config/cloudinary');
const { fileUploadService } = require('../services');

const uploadSingle = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file was uploaded' });
        }

        const result = await fileUploadService.uploadImage(req.file, req.body.folder);

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: fileUploadService.formatUploadResult(result),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files were uploaded' });
        }

        const uploadPromises = req.files.map((file) => fileUploadService.uploadImage(file, req.body.folder));
        const results = await Promise.all(uploadPromises);

        return res.status(200).json({
            success: true,
            message: `${results.length} image(s) uploaded successfully`,
            data: results.map(fileUploadService.formatUploadResult),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({ success: false, message: 'Missing publicId' });
        }

        const decoded = decodeURIComponent(publicId);
        const result = await cloudinary.uploader.destroy(decoded);

        if (result.result !== 'ok') {
            return res.status(404).json({ success: false, message: 'Image not found or deletion failed' });
        }

        return res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadSingle, uploadMultiple, deleteImage };
