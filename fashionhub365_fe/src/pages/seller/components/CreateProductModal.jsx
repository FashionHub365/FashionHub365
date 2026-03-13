import React, { useState, useEffect } from 'react';
import { getCategories, uploadImage } from '../../../services/productService';
import listingApi from '../../../apis/listingApi';

const COLOR_MAP = {
  black: "#1a1a1a",
  white: "#ffffff",
  blue: "#21558d",
  brown: "#925c37",
  green: "#585b45",
  grey: "#e1e1e3",
  gray: "#e1e1e3",
  orange: "#d38632",
  pink: "#efcec9",
  red: "#bd2830",
  tan: "#b3a695",
  navy: "#1b2a4a",
  beige: "#f5e6c8",
  yellow: "#f5c842",
  purple: "#6b2fa0",
  "đen": "#1a1a1a",
  "trắng": "#ffffff",
  "xám": "#e1e1e3",
  "be": "#f5e6c8",
  "collegiate green": "#1b4f23",
  "black/white": "linear-gradient(135deg, #1a1a1a 50%, #ffffff 50%)",
  "white/green": "linear-gradient(135deg, #ffffff 50%, #585b45 50%)",
};

function getColorHex(colorName) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}

const CreateProductModal = ({ onClose, onSave, storeStatus }) => {
    const [form, setForm] = useState({
        name: '',
        short_description: '',
        description: '',
        base_price: '',
        status: storeStatus === 'active' ? 'active' : 'draft',
        primary_category_id: '',
        media: [],
        variants: []
    });
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [sizeType, setSizeType] = useState('clothing');
    const [categories, setCategories] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [clothingSizes, setClothingSizes] = useState([]);
    const [waistSizes, setWaistSizes] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, optRes] = await Promise.all([
                    getCategories(),
                    listingApi.getFilterOptions()
                ]);
                
                setCategories(catRes.data || catRes || []);
                
                if (optRes.success) {
                    setColorOptions(optRes.data.colors.map(name => ({ name, hex: getColorHex(name) })));
                    
                    const sizes = optRes.data.sizes || [];
                    setWaistSizes(sizes.filter(s => !isNaN(parseInt(s))));
                    setClothingSizes(sizes.filter(s => isNaN(parseInt(s))));
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    // Generate variants automatically when colors or sizes change
    useEffect(() => {
        if (selectedColors.length === 0 && selectedSizes.length === 0) {
            setForm(prev => ({ ...prev, variants: [] }));
            return;
        }

        const newVariants = [];
        
        // If only colors are selected
        if (selectedColors.length > 0 && selectedSizes.length === 0) {
            selectedColors.forEach(color => {
                newVariants.push({
                    variantName: color,
                    price: form.base_price ? Number(form.base_price) * 1000 : 0,
                    stock: 0,
                    attributes: { color }
                });
            });
        } 
        // If only sizes are selected
        else if (selectedColors.length === 0 && selectedSizes.length > 0) {
            selectedSizes.forEach(size => {
                newVariants.push({
                    variantName: size,
                    price: form.base_price ? Number(form.base_price) * 1000 : 0,
                    stock: 0,
                    attributes: { size }
                });
            });
        }
        // If both are selected (Cartesian product)
        else {
            selectedColors.forEach(color => {
                selectedSizes.forEach(size => {
                    newVariants.push({
                        variantName: `${color} - ${size}`,
                        price: form.base_price ? Number(form.base_price) * 1000 : 0,
                        stock: 0,
                        attributes: { color, size }
                    });
                });
            });
        }

        setForm(prev => ({ ...prev, variants: newVariants }));
    }, [selectedColors, selectedSizes, form.base_price]);

    const toggleColor = (colorName) => {
        setSelectedColors(prev => 
            prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
        );
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const handleSizeTypeChange = (type) => {
        setSizeType(type);
        setSelectedSizes([]); // Reset selections when type changes
    };

    const handleVariantChange = (index, field, value) => {
        setForm(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
    };

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
                if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) {
                    newMedia[0].isPrimary = true;
                }
                return { ...prev, media: newMedia };
            });
        } catch (err) {
            setError('Lỗi khi tải ảnh. Thử lại sau.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (publicId) => {
        setForm(prev => {
            const newMedia = prev.media.filter(img => img.publicId !== publicId);
            if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) {
                newMedia[0].isPrimary = true;
            }
            return { ...prev, media: newMedia };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation logic
        if (!form.name.trim()) { setError('Tên sản phẩm không được để trống'); return; }
        if (!form.primary_category_id) { setError('Vui lòng chọn danh mục'); return; }
        if (!form.base_price || Number(form.base_price) <= 0) { setError('Giá niêm yết phải lớn hơn 0'); return; }
        
        if (selectedColors.length === 0) { setError('Vui lòng chọn ít nhất một màu sắc'); return; }
        if (selectedSizes.length === 0) { setError('Vui lòng chọn ít nhất một kích cỡ'); return; }
        
        const missingStock = form.variants.some(v => v.stock === '' || v.stock === null || v.stock < 0);
        if (missingStock) { setError('Vui lòng nhập số lượng tồn kho hợp lệ cho tất cả phân loại'); return; }

        if (form.media.length === 0) { setError('Vui lòng tải lên ít nhất một hình ảnh sản phẩm'); return; }
        
        if (!form.short_description.trim()) { setError('Mô tả ngắn không được để trống'); return; }
        if (!form.description.trim()) { setError('Chi tiết sản phẩm không được để trống'); return; }

        setLoading(true);
        setError('');
        try {
            await onSave({
                ...form,
                base_price: Number(form.base_price) * 1000,
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header - Minimalist */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white flex-none">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] mt-1">Hệ thống quản lý Seller</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-gray-50 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl px-4 py-3.5 flex items-center gap-3">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Thông báo Store Pending */}
                        {storeStatus !== 'active' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-6 py-5 space-y-2">
                                <div className="flex items-center gap-2.5 text-amber-800">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-bold uppercase tracking-wider">Cửa hàng đang chờ duyệt</span>
                                </div>
                                <p className="text-[11px] text-amber-600 leading-relaxed">
                                    Sản phẩm mới của bạn sẽ được lưu ở trạng thái <b>Bản nháp (Draft)</b>. Bạn có thể công khai sản phẩm sau khi Admin phê duyệt cửa hàng của bạn.
                                </p>
                            </div>
                        )}

                        {/* Thông tin cơ bản */}
                        <div className="space-y-6">
                            <div className="border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Thông tin cơ bản</h3>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên sản phẩm *</label>
                                    <input
                                        type="text" name="name" value={form.name} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm placeholder:text-gray-300 shadow-sm"
                                        placeholder="Ví dụ: Áo sơ mi Linen cao cấp"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Danh mục *</label>
                                        <div className="relative">
                                            <select
                                                name="primary_category_id" value={form.primary_category_id} onChange={handleChange}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="">Chọn danh mục</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giá niêm yết (x1000 VNĐ) *</label>
                                        <div className="relative">
                                            <input
                                                type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0"
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm font-bold shadow-sm"
                                                placeholder="Ví dụ: 250"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                                                .000đ
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Size & Colors */}
                        <div className="space-y-6 pt-2">
                            <div className="border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Size & Màu sắc</h3>
                            </div>

                            <div className="space-y-10 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                                {/* Colors - Centered */}
                                <div className="space-y-5 flex flex-col items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-2 px-10">Màu sắc *</label>
                                    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                                        {colorOptions.length === 0 ? (
                                            <p className="text-[10px] text-gray-400">Đang tải màu sắc...</p>
                                        ) : colorOptions.map(color => (
                                            <button
                                                key={color.name} type="button" onClick={() => toggleColor(color.name)}
                                                className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all ${
                                                    selectedColors.includes(color.name) 
                                                    ? 'border-black bg-black text-white shadow-md' 
                                                    : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: color.hex }}></div>
                                                <span className="text-[11px] font-bold">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sizes - Centered */}
                                <div className="space-y-10 flex flex-col items-center">
                                    <div className="flex gap-6 p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleSizeTypeChange('clothing')}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                sizeType === 'clothing' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            <input type="radio" checked={sizeType === 'clothing'} readOnly className="hidden" />
                                            Kích thước Quần áo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSizeTypeChange('shoe')}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                sizeType === 'shoe' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            <input type="radio" checked={sizeType === 'shoe'} readOnly className="hidden" />
                                            Kích thước Giày
                                        </button>
                                    </div>

                                    {sizeType === 'clothing' ? (
                                        <div className="space-y-5 flex flex-col items-center w-full animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-2 px-10">Chọn size Quần áo *</label>
                                            <div className="flex flex-wrap justify-center gap-2.5">
                                                {clothingSizes.length === 0 ? (
                                                    <p className="text-[10px] text-gray-400">Đang tải kích cỡ...</p>
                                                ) : clothingSizes.map(size => (
                                                    <button
                                                        key={size} type="button" onClick={() => toggleSize(size)}
                                                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all ${
                                                            selectedSizes.includes(size)
                                                            ? 'bg-black border-black text-white shadow-md scale-105'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5 flex flex-col items-center w-full animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-2 px-10">Chọn size Giày / Eo *</label>
                                            <div className="flex flex-wrap justify-center gap-2.5 max-w-md">
                                                {waistSizes.length === 0 ? (
                                                    <p className="text-[10px] text-gray-400">Đang tải kích cỡ...</p>
                                                ) : waistSizes.map(size => (
                                                    <button
                                                        key={size} type="button" onClick={() => toggleSize(size)}
                                                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all ${
                                                            selectedSizes.includes(size)
                                                            ? 'bg-black border-black text-white shadow-md scale-105'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Variants Table */}
                                {form.variants.length > 0 && (
                                    <div className="pt-8 border-t border-gray-50 overflow-x-auto">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Chi tiết tồn kho</h4>
                                            <span className="text-[9px] text-gray-400 font-medium italic">Tự động tạo dựa trên lựa chọn phía trên</span>
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-gray-100">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <th className="px-5 py-4">Màu sắc & Kích cỡ</th>
                                                        <th className="px-5 py-4 text-right">Số lượng tồn kho *</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 bg-white">
                                                    {form.variants.map((variant, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-4 text-xs font-bold text-gray-700">{variant.variantName}</td>
                                                            <td className="px-5 py-4 text-right">
                                                                <input
                                                                    type="number" value={variant.stock} min="0"
                                                                    onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value))}
                                                                    className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-md text-right text-xs font-bold focus:border-black outline-none transition-all shadow-sm"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hình ảnh */}
                        <div className="space-y-6 pt-2">
                            <div className="flex items-center justify-between border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Hình ảnh *</h3>
                                <span className="text-[9px] text-gray-400 font-medium">Tối đa 5 ảnh. Ảnh đầu làm ảnh chính.</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4">
                                {form.media.map((img) => (
                                    <div key={img.publicId} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 bg-white group">
                                        <img src={img.url} alt="product" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button" onClick={() => removeImage(img.publicId)}
                                                className="bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-sm transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {img.isPrimary && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black text-white text-[8px] py-1 text-center font-bold uppercase tracking-widest">Main</div>
                                        )}
                                    </div>
                                ))}
                                
                                {form.media.length < 5 && (
                                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all">
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-gray-400 group">
                                                <svg className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">Thêm ảnh</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} multiple />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Mô tả */}
                        <div className="space-y-6 pt-2">
                            <div className="border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Mô tả sản phẩm *</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả ngắn *</label>
                                    <input
                                        type="text" name="short_description" value={form.short_description} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm shadow-sm"
                                        placeholder="Tóm tắt điểm nổi bật..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chi tiết sản phẩm *</label>
                                    <textarea
                                        name="description" value={form.description} onChange={handleChange} rows={6}
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm resize-none shadow-sm"
                                        placeholder="Mô tả kỹ hơn về chất liệu, nguồn gốc..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái đăng bán *</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                            form.status === 'active' ? 'border-black bg-black text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                        } ${storeStatus !== 'active' ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}>
                                            <input 
                                                type="radio" name="status" value="active" checked={form.status === 'active'} 
                                                onChange={handleChange} className="hidden" 
                                                disabled={storeStatus !== 'active'}
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Đang bán (Active)</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                            form.status === 'draft' ? 'border-black bg-black text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                        }`}>
                                            <input 
                                                type="radio" name="status" value="draft" checked={form.status === 'draft'} 
                                                onChange={handleChange} className="hidden" 
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Bản nháp (Draft)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex gap-4 bg-white flex-none">
                    <button 
                        type="button" onClick={onClose}
                        className="px-8 py-3.5 text-gray-400 hover:text-gray-900 font-bold text-[10px] uppercase tracking-widest transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit" 
                        onClick={(e) => handleSubmit(e)}
                        disabled={loading || uploading}
                        className="flex-1 px-8 py-3.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-lg active:scale-[0.98]"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận Đăng bán'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProductModal;
