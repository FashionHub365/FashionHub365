const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper: convert buffer → stream to upload to Cloudinary
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/**
 * Upload single image
 * POST /api/upload/single
 */
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded' });
    }

    const result = await uploadToCloudinary(req.file, req.body.folder);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: formatResult(result),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload multiple images (max 5)
 * POST /api/upload/multiple
 */
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const uploadPromises = req.files.map((file) => uploadToCloudinary(file, req.body.folder));
    const results = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: `${results.length} image(s) uploaded successfully`,
      data: results.map(formatResult),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete image by public_id
 * DELETE /api/upload/:publicId
 */
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Missing publicId' });
    }

    // Decode because publicId may contain /
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const uploadToCloudinary = (file, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Auto optimize quality and format
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(new Error(error.message));
        resolve(result);
      }
    );

    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

const formatResult = (result) => ({
  publicId: result.public_id,
  url: result.secure_url,
  width: result.width,
  height: result.height,
  format: result.format,
  size: result.bytes,
});

module.exports = { uploadSingle, uploadMultiple, deleteImage };