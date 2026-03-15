export const getProductMainImage = (product: any): string => {
  if (!product) return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80';

  // 1. Prioritize 'media' array sorted by sortOrder (like ProductDetail)
  if (product.media && product.media.length > 0) {
    const sortedMedia = [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return sortedMedia[0].url;
  }

  // 2. Fallback to first variant's image if available
  if (product.variants && product.variants.length > 0 && product.variants[0].image) {
    return product.variants[0].image;
  }

  // 3. Absolute fallback image
  return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80';
};
