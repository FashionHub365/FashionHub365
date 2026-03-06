import React, { useState, useEffect } from 'react';
import { getCategories, uploadImage } from '../../../services/productService';

const COLOR_OPTIONS = [
    { name: "Black", hex: "#1a1a1a" },
    { name: "Blue", hex: "#21558d" },
    { name: "Brown", hex: "#925c37" },
    { name: "Green", hex: "#585b45" },
    { name: "Grey", hex: "#e1e1e3" },
    { name: "Orange", hex: "#d38632" },
    { name: "Pink", hex: "#efcec9" },
    { name: "Red", hex: "#bd2830" },
    { name: "Tan", hex: "#b3a695" },
];

const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const STATUS_LABELS = {
    draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-700' },
    active: { label: 'Đang bán', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Hết hàng', className: 'bg-red-100 text-red-700' },
    blocked: { label: 'Bị khóa', className: 'bg-orange-100 text-orange-700' },
};

const EditProductModal = ({ product, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: product.name || '',
        short_description: product.short_description || '',
        description: product.description || '',
        base_price: product.base_price ? product.base_price / 1000 : '',
        status: product.status || 'draft',
        primary_category_id: product.primary_category_id?._id || product.primary_category_id || '',
        media: product.media || [],
        variants: product.variants || []
    });
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill selected colors and sizes from existing variants
    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            const colors = new Set();
            const sizes = new Set();
            product.variants.forEach(v => {
                if (v.attributes?.color) colors.add(v.attributes.color);
                if (v.attributes?.size) sizes.add(v.attributes.size);
            });
            setSelectedColors(Array.from(colors));
            setSelectedSizes(Array.from(sizes));
        }
    }, [product.variants]);

    // Generate/Update variants when selections change
    useEffect(() => {
        // Only auto-generate if we're adding new combinations
        // This is tricky for Edit, let's just allow adding/removing
        if (selectedColors.length === 0 && selectedSizes.length === 0) {
            return;
        }

        const newVariants = [];
        if (selectedColors.length > 0 && selectedSizes.length === 0) {
            selectedColors.forEach(color => {
                const existing = form.variants.find(v => v.attributes?.color === color && !v.attributes?.size);
                newVariants.push(existing || {
                    variantName: color,
                    price: form.base_price ? Number(form.base_price) * 1000 : 0,
                    stock: 0,
                    attributes: { color }
                });
            });
        } else if (selectedColors.length === 0 && selectedSizes.length > 0) {
            selectedSizes.forEach(size => {
                const existing = form.variants.find(v => v.attributes?.size === size && !v.attributes?.color);
                newVariants.push(existing || {
                    variantName: size,
                    price: form.base_price ? Number(form.base_price) * 1000 : 0,
                    stock: 0,
                    attributes: { size }
                });
            });
        } else {
            selectedColors.forEach(color => {
                selectedSizes.forEach(size => {
                    const existing = form.variants.find(v => v.attributes?.color === color && v.attributes?.size === size);
                    newVariants.push(existing || {
                        variantName: `${color} - ${size}`,
                        price: form.base_price ? Number(form.base_price) * 1000 : 0,
                        stock: 0,
                        attributes: { color, size }
                    });
                });
            });
        }
        setForm(prev => ({ ...prev, variants: newVariants }));
    }, [selectedColors, selectedSizes]);

    const toggleColor = (colorName) => {
        setSelectedColors(prev => prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]);
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const handleVariantChange = (index, field, value) => {
        setForm(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
    };

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
                    isPrimary: false
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
            setError('Lỗi khi tải một hoặc nhiều ảnh lên.');
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

        setLoading(true);
        setError('');
        try {
            await onSave(product._id, {
                ...form,
                base_price: Number(form.base_price) * 1000, // Multiply by 1000 as requested
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header - Fixed */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white flex-none">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chỉnh sửa sản phẩm</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Product ID: {product._id?.substring(0, 8)}...</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                        title="Đóng"
                    >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl px-5 py-4 flex items-center gap-3 animate-shake">
                                <div className="bg-red-100 p-1.5 rounded-full">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* Section: Thông tin cơ bản */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">Thông tin sản phẩm</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-5 pl-9">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Tên sản phẩm *</label>
                                    <input
                                        type="text" name="name" value={form.name} onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium placeholder:text-gray-300 shadow-sm"
                                        placeholder="Nhập tên sản phẩm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Danh mục</label>
                                        <div className="relative group">
                                            <select
                                                name="primary_category_id" value={form.primary_category_id} onChange={handleChange}
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="">-- Chọn danh mục --</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Giá cơ bản *</label>
                                        <div className="relative group">
                                            <input
                                                type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0"
                                                className="w-full pl-5 pr-16 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-[15px] font-black text-blue-600 shadow-sm"
                                                placeholder="Ví dụ: 150"
                                            />
                                            <div className="absolute right-2 top-2 bottom-2 px-4 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center group-focus-within:bg-blue-600 group-focus-within:border-blue-600 transition-all">
                                                <span className="text-[10px] font-black text-gray-500 group-focus-within:text-white uppercase tracking-tighter">.000đ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Trạng thái</label>
                                        <div className="relative group">
                                            <select
                                                name="status" value={form.status} onChange={handleChange}
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-black cursor-pointer appearance-none shadow-sm"
                                            >
                                                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                                    <option key={val} value={val}>{label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Màu sắc và size */}
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">Màu sắc và size</h3>
                            </div>

                            <div className="pl-9 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                                    {/* Colors */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bảng màu</label>
                                            {selectedColors.length > 0 && <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase italic">Đã chọn {selectedColors.length}</span>}
                                        </div>
                                        <div className="grid grid-cols-5 gap-3">
                                            {COLOR_OPTIONS.map(color => (
                                                <button
                                                    key={color.name} type="button" onClick={() => toggleColor(color.name)}
                                                    className="group relative flex flex-col items-center gap-1.5 transition-all"
                                                    title={color.name}
                                                >
                                                    <div 
                                                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shadow-sm relative ${
                                                            selectedColors.includes(color.name) 
                                                            ? 'border-blue-500 ring-4 ring-blue-500/10 scale-110 z-10' 
                                                            : 'border-white hover:border-gray-200 hover:scale-105'
                                                        }`}
                                                        style={{ backgroundColor: color.hex }}
                                                    >
                                                        {selectedColors.includes(color.name) && (
                                                            <svg className={`w-4 h-4 ${['Black', 'Blue', 'Green', 'Red', 'Brown'].includes(color.name) ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter truncate w-full text-center transition-colors ${selectedColors.includes(color.name) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                        {color.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sizes */}
                                    <div className="space-y-4 md:border-l md:border-gray-200/50 md:pl-8">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Kích cỡ</label>
                                            {selectedSizes.length > 0 && <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase italic">Đã chọn {selectedSizes.length}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {CLOTHING_SIZES.map(size => (
                                                <button
                                                    key={size} type="button" onClick={() => toggleSize(size)}
                                                    className={`px-4 py-2 text-[10px] font-black rounded-xl border-2 transition-all active:scale-90 ${
                                                        selectedSizes.includes(size)
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Variants Table */}
                                {form.variants.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto ring-1 ring-gray-50">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50/50 text-gray-400 text-[9px] uppercase tracking-widest font-black">
                                                <tr>
                                                    <th className="px-6 py-4 border-b border-gray-100">Cấu hình chi tiết</th>
                                                    <th className="px-6 py-4 border-b border-gray-100 text-center">Tồn kho *</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {form.variants.map((variant, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/10 transition-colors">
                                                        <td className="px-6 py-4 font-black text-gray-700">{variant.variantName}</td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number" value={variant.stock} min="0"
                                                                onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value))}
                                                                className="w-full max-w-[120px] mx-auto text-center px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-black text-gray-600"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Hình ảnh */}
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">Hình ảnh sản phẩm</h3>
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter italic">Tối đa 05 ảnh - Ảnh đầu mặc định là ảnh chính</span>
                            </div>
                            
                            <div className="pl-9 flex flex-wrap gap-4">
                                {form.media.map((img) => (
                                    <div key={img.publicId} className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden border-2 border-gray-100 group shadow-sm bg-gray-50">
                                        <img src={img.url} alt="product" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <button
                                                type="button"
                                                onClick={() => removeImage(img.publicId)}
                                                className="bg-red-500 p-2.5 rounded-2xl text-white hover:bg-red-600 transition-all shadow-xl active:scale-90"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {img.isPrimary && (
                                            <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] px-2.5 py-1 rounded-br-2xl font-black uppercase tracking-widest shadow-lg">Main</div>
                                        )}
                                    </div>
                                ))}
                                
                                {form.media.length < 5 && (
                                    <label className="w-24 h-24 rounded-[1.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group active:scale-95 shadow-inner">
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent shadow-sm"></div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <div className="bg-gray-100 p-2.5 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-tighter">Thêm ảnh</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} multiple />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Section: Mô tả */}
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">Mô tả sản phẩm</h3>
                            </div>

                            <div className="pl-9 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Mô tả ngắn</label>
                                    <input
                                        type="text" name="short_description" value={form.short_description} onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium shadow-sm"
                                        placeholder="Tóm tắt điểm nổi bật..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 mb-2 uppercase tracking-widest">Chi tiết sản phẩm</label>
                                    <textarea
                                        name="description" value={form.description} onChange={handleChange} rows={5}
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium resize-none shadow-sm"
                                        placeholder="Mô tả kỹ hơn về sản phẩm..."
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer - Fixed */}
                <div className="px-8 py-6 border-t border-gray-100 flex gap-4 bg-white flex-none">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-gray-700 transition-all font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 shadow-sm border border-gray-100"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit" 
                        onClick={(e) => handleSubmit(e)}
                        disabled={loading || uploading}
                        className="flex-[1.5] px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all font-black text-[11px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-100 active:scale-95 relative overflow-hidden group"
                    >
                        <span className="relative z-10">{loading ? 'Đang lưu...' : 'Lưu thay đổi ngay'}</span>
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
