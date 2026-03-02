const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadSingle, uploadMultiple, deleteImage } = require('../controllers/upload.controller');

// Middleware to handle multer errors (file too large, wrong type...)
const handleMulterError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large, maximum 5MB' });
  }
  if (err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// POST /api/upload/single  — upload 1 image, field name is "image"
router.post(
  '/single',
  (req, res, next) => upload.single('image')(req, res, (err) => err ? handleMulterError(err, req, res, next) : next()),
  uploadSingle
);

// POST /api/upload/multiple  — upload multiple images (max 5), field name is "images"
router.post(
  '/multiple',
  (req, res, next) => upload.array('images', 5)(req, res, (err) => err ? handleMulterError(err, req, res, next) : next()),
  uploadMultiple
);

// DELETE /api/upload/:publicId  — delete image (encode publicId if it contains /)
router.delete('/:publicId', deleteImage);

module.exports = router;