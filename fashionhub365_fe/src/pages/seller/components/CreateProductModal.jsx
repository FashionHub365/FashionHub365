import React, { useState, useEffect } from 'react';
import { getCategories, uploadImage } from '../../../services/productService';

const CreateProductModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        name: '',
        short_description: '',
        description: '',
        base_price: '',
        status: 'active',
        primary_category_id: '',
        media: [],
        variants: []
    });
    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategories();
                setCategories(res.data || res || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit total images to 5
        const remainingSlots = 5 - form.media.length;
        const filesToUpload = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            setError(`Bạn chỉ có thể thêm tối đa 5 hình ảnh. Hệ thống sẽ chỉ tải lên ${remainingSlots} ảnh đầu tiên.`);
        }

        setUploading(true);
        try {
            const uploadPromises = filesToUpload.map(async (file) => {
                const res = await uploadImage(file);
                return {
                    url: res.url,
                    publicId: res.publicId,
                    isPrimary: false // Will set primary later if needed
                };
            });

            const uploadedMedia = await Promise.all(uploadPromises);
            
            setForm(prev => {
                const newMedia = [...prev.media, ...uploadedMedia];
                // Ensure the first one is primary if none are
                if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) {
                    newMedia[0].isPrimary = true;
                }
                return { ...prev, media: newMedia };
            });
        } catch (err) {
            setError('Lỗi khi tải một hoặc nhiều ảnh lên. Thử lại sau.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (publicId) => {
        setForm(prev => {
            const newMedia = prev.media.filter(img => img.publicId !== publicId);
            // If we removed the primary image, set a new one
            if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) {
                newMedia[0].isPrimary = true;
            }
            return { ...prev, media: newMedia };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Tên sản phẩm không được để trống'); return; }
        if (!form.base_price || Number(form.base_price) <= 0) { setError('Giá phải lớn hơn 0'); return; }
        if (!form.primary_category_id) { setError('Vui lòng chọn danh mục'); return; }

        setLoading(true);
        setError('');
        try {
            await onSave({
                ...form,
                base_price: Number(form.base_price) * 1000, // Multiply by 1000 as requested
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-20">
                    <h2 className="text-xl font-bold text-gray-900">Đăng sản phẩm mới</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                            <input
                                type="text" name="name" value={form.name} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="Nhập tên sản phẩm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                            <select
                                name="primary_category_id" value={form.primary_category_id} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản (x1000 VND) *</label>
                            <div className="relative">
                                <input
                                    type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0"
                                    className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="Ví dụ: 150 (tương đương 150.000đ)"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">.000đ</span>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {form.media.map((img) => (
                                <div key={img.publicId} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.url} alt="product" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.publicId)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    {img.isPrimary && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[8px] text-center py-0.5 font-bold uppercase">Chính</span>
                                    )}
                                </div>
                            ))}
                            
                            {form.media.length < 5 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-[10px] text-gray-500 mt-1">Thêm ảnh</span>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        disabled={uploading} 
                                        multiple 
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic">* Tối đa 5 hình ảnh. Ảnh đầu tiên sẽ là ảnh chính.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                        <input
                            type="text" name="short_description" value={form.short_description} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Mô tả sơ lược sản phẩm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                            placeholder="Mô tả đầy đủ về chất liệu, kích thước,..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading || uploading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200">
                            {loading ? 'Đang xử lý...' : 'Đăng sản phẩm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductModal;
