/**
 * Validation utility for Product data
 * @param {Object} data - The product data to validate
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
const validateProductData = (data) => {
  const errors = {};

  // 1. Validate Required Fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Tên sản phẩm là bắt buộc và phải là chuỗi ký tự.';
  }

  if (!data.store_id || typeof data.store_id !== 'string') {
    errors.store_id = 'Store ID là bắt buộc.';
  }

  if (data.base_price === undefined || data.base_price === null) {
    errors.base_price = 'Giá gốc là bắt buộc.';
  } else if (typeof data.base_price !== 'number' || data.base_price < 0) {
    errors.base_price = 'Giá gốc phải là số dương.';
  }

  // 2. Validate Status Enum
  const validStatuses = ['draft', 'active', 'inactive', 'blocked'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = `Trạng thái không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}`;
  }

  // 3. Validate Media Array (Optional but strict if present)
  if (data.media) {
    if (!Array.isArray(data.media)) {
      errors.media = 'Media phải là một mảng.';
    } else {
      data.media.forEach((item, index) => {
        if (!item.url || typeof item.url !== 'string') {
          errors[`media[${index}].url`] = 'URL media là bắt buộc.';
        }
        if (item.mediaType && !['image', 'video'].includes(item.mediaType)) {
             errors[`media[${index}].mediaType`] = 'Loại media phải là image hoặc video.';
        }
      });
    }
  }

  // 4. Validate Variants (Optional but strict if present)
  if (data.variants) {
      if (!Array.isArray(data.variants)) {
          errors.variants = 'Biến thể phải là một mảng.';
      } else {
          data.variants.forEach((variant, index) => {
              if (variant.price !== undefined && (typeof variant.price !== 'number' || variant.price < 0)) {
                  errors[`variants[${index}].price`] = 'Giá biến thể phải là số dương.';
              }
              if (variant.stock !== undefined && (typeof variant.stock !== 'number' || variant.stock < 0)) {
                  errors[`variants[${index}].stock`] = 'Tồn kho biến thể phải là số không âm.';
              }
          });
      }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateProductData
};
