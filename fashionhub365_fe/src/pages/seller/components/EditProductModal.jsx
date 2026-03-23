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

const STATUS_LABELS = {
    'active': { label: 'Đang bán', color: 'bg-green-500' },
    'inactive': { label: 'Tạm ẩn/Nháp', color: 'bg-gray-400' },
    'out_of_stock': { label: 'Hết hàng', color: 'bg-red-500' }
};

const EditProductModal = ({ product, onClose, onSave, storeStatus }) => {
    const [form, setForm] = useState({
        name: product.name || '',
        short_description: product.short_description || '',
        description: product.description || '',
        base_price: product.base_price / 1000 || '',
        status: product.status || 'active',
        primary_category_id: product.primary_category_id?._id || product.primary_category_id || '',
        media: product.media || [],
        variants: product.variants || []
    });
    const [colorImageMap, setColorImageMap] = useState({}); // { 'Red': 'url' }

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

        // Initialize selected colors and sizes from existing variants
        if (product.variants?.length > 0) {
            const colors = new Set();
            const sizes = new Set();
            let detectedType = 'clothing';

            product.variants.forEach(v => {
                if (v.attributes?.color) colors.add(v.attributes.color);
                if (v.attributes?.size) {
                    const sizeVal = v.attributes.size;
                    sizes.add(sizeVal);
                    // If any size is purely numeric, it's likely a shoe/waist size
                    if (!isNaN(parseInt(sizeVal)) && /^\d+$/.test(sizeVal)) {
                        detectedType = 'shoe';
                    }
                }
            });
            setSelectedColors(Array.from(colors));
            setSelectedSizes(Array.from(sizes));
            setSizeType(detectedType);

            // Initialize colorImageMap from existing variants
            const initialMap = {};
            product.variants.forEach(v => {
                if (v.attributes?.color && v.image_url) {
                    initialMap[v.attributes.color] = v.image_url;
                }
            });
            setColorImageMap(initialMap);
        }
    }, [product]);

    // Update variants logic
    useEffect(() => {
        if (selectedColors.length === 0 && selectedSizes.length === 0) return;

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

        // Auto-switch size type based on selected category
        if (name === 'primary_category_id' && value) {
            const selectedCat = categories.find(c => (c._id === value || c.id === value));
            if (selectedCat) {
                const catName = selectedCat.name.toLowerCase();
                const isShoe = ['giày', 'dép', 'shoes', 'shoe', 'footwear'].some(kw => catName.includes(kw));
                handleSizeTypeChange(isShoe ? 'shoe' : 'clothing');
            }
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const remainingSlots = 5 - form.media.length;
        const filesToUpload = files.slice(0, remainingSlots);

        setUploading(true);
        try {
            const uploadPromises = filesToUpload.map(async (file) => {
                const res = await uploadImage(file);
                return { url: res.url, publicId: res.publicId, isPrimary: false };
            });
            const uploadedMedia = await Promise.all(uploadPromises);
            setForm(prev => {
                const newMedia = [...prev.media, ...uploadedMedia];
                if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) newMedia[0].isPrimary = true;
                return { ...prev, media: newMedia };
            });
        } catch (err) {
            setError('Lỗi khi tải ảnh.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (publicId) => {
        setForm(prev => {
            const newMedia = prev.media.filter(img => img.publicId !== publicId);
            if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) newMedia[0].isPrimary = true;
            return { ...prev, media: newMedia };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) { setError('Tên sản phẩm không được để trống'); return; }
        if (!form.primary_category_id) { setError('Vui lòng chọn danh mục'); return; }
        if (!form.base_price || Number(form.base_price) <= 0) { setError('Giá niêm yết phải lớn hơn 0'); return; }
        if (selectedColors.length === 0) { setError('Vui lòng chọn ít nhất một màu sắc'); return; }
        if (selectedSizes.length === 0) { setError('Vui lòng chọn ít nhất một kích cỡ'); return; }

        const missingStock = form.variants.some(v => v.stock === '' || v.stock === null || v.stock < 0);
        if (missingStock) { setError('Vui lòng nhập số lượng tồn kho hợp lệ'); return; }

        if (form.media.length === 0) { setError('Vui lòng tải lên ít nhất một hình ảnh sản phẩm'); return; }
        if (!form.short_description.trim()) { setError('Mô tả ngắn không được để trống'); return; }
        if (!form.description.trim()) { setError('Chi tiết sản phẩm không được để trống'); return; }

        setLoading(true);
        setError('');
        try {
            const finalVariants = form.variants.map(v => ({
                ...v,
                image_url: colorImageMap[v.attributes?.color] || (form.media.find(m => m.isPrimary)?.url || form.media[0]?.url)
            }));

            await onSave(product._id, {
                ...form,
                variants: finalVariants,
                base_price: Number(form.base_price) * 1000,
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white flex-none">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h2>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] mt-1">ID: {product._id?.substring(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
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

                        {/* Section 1 */}
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
                                        placeholder="Nhập tên"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giá niêm yết (x1000) *</label>
                                        <div className="relative">
                                            <input
                                                type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0"
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm font-bold shadow-sm"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">.000đ</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</label>
                                        <div className="relative">
                                            <select
                                                name="status" value={form.status} onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-black transition-all outline-none text-sm cursor-pointer appearance-none shadow-sm font-bold ${storeStatus !== 'active' && form.status === 'active' ? 'text-amber-600' : ''
                                                    }`}
                                            >
                                                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                                    <option
                                                        key={val}
                                                        value={val}
                                                        disabled={val === 'active' && storeStatus !== 'active'}
                                                    >
                                                        {label} {val === 'active' && storeStatus !== 'active' ? '(Chờ duyệt Store)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Images - Moved up and upgraded */}
                        <div className="space-y-6 pt-2">
                            <div className="flex items-center justify-between border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Hình ảnh sản phẩm *</h3>
                                <span className="text-[9px] text-gray-400 font-medium">Tối đa 5 ảnh. Ảnh số 1 sẽ làm ảnh đại diện.</span>
                            </div>

                            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                {form.media.map((img, idx) => (
                                    <div key={img.publicId} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 bg-white group shadow-sm transition-transform hover:scale-105">
                                        <img src={img.url} alt="product" className="w-full h-full object-cover" />

                                        {/* Index Badge */}
                                        <div className="absolute top-1 left-1 bg-black/70 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold backdrop-blur-sm border border-white/20">
                                            {idx + 1}
                                        </div>

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
                                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group">
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

                        {/* Section 3: Colors & Sizes */}
                        <div className="space-y-6 pt-2">
                            <div className="border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Size & Màu sắc</h3>
                            </div>

                            <div className="space-y-10 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                                {/* Colors - Centered Layout */}
                                <div className="space-y-5 flex flex-col items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-gray-50 pb-2 px-10">Màu sắc *</label>
                                    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                                        {colorOptions.length === 0 ? (
                                            <p className="text-[10px] text-gray-400">Đang tải màu sắc...</p>
                                        ) : colorOptions.map(color => (
                                            <button
                                                key={color.name} type="button" onClick={() => toggleColor(color.name)}
                                                className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all ${selectedColors.includes(color.name) ? 'border-black bg-black text-white shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-black/5" style={{ background: color.hex }}></div>
                                                <span className="text-[11px] font-bold">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selected Colors with Image Assignment */}
                                    {selectedColors.length > 0 && (
                                        <div className="w-full mt-6 space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Gán ảnh cho màu sắc</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selectedColors.map(colorName => (
                                                    <div key={colorName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: getColorHex(colorName) }}></div>
                                                            <span className="text-xs font-bold text-gray-700">{colorName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {colorImageMap[colorName] ? (
                                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                                                    <img src={colorImageMap[colorName]} alt="" className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button" onClick={() => setColorImageMap(prev => ({ ...prev, [colorName]: null }))}
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                                                                    >
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap gap-2">
                                                                {form.media.length > 0 ? (
                                                                    form.media.map((img, i) => (
                                                                        <button
                                                                            key={img.publicId}
                                                                            type="button"
                                                                            onClick={() => setColorImageMap(prev => ({
                                                                                ...prev,
                                                                                [colorName]: prev[colorName] === img.url ? null : img.url
                                                                            }))}
                                                                            className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${colorImageMap[colorName] === img.url
                                                                                ? 'border-black scale-110 shadow-md ring-2 ring-black/5'
                                                                                : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                                                                                }`}
                                                                            title={`Ảnh ${i + 1}`}
                                                                        >
                                                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                                            <div className="absolute top-0.5 left-0.5 bg-black/60 text-white min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center text-[8px] font-bold backdrop-blur-sm">
                                                                                {i + 1}
                                                                            </div>
                                                                            {colorImageMap[colorName] === img.url && (
                                                                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                                                    <svg className="w-4 h-4 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-400 italic font-medium bg-gray-100 px-3 py-1.5 rounded-lg border border-dashed border-gray-200">Chưa có ảnh</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {form.media.length === 0 && (
                                                <p className="text-[9px] text-red-400 text-center font-medium">(!) Vui lòng tải ảnh lên ở phần "HÌNH ẢNH SẢN PHẨM *" phía trên trước khi gán cho màu sắc.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sizes - Centered Layout */}
                                <div className="space-y-10 flex flex-col items-center">
                                    <div className="flex gap-6 p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleSizeTypeChange('clothing')}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${sizeType === 'clothing' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            <input type="radio" checked={sizeType === 'clothing'} readOnly className="hidden" />
                                            Kích thước Quần áo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSizeTypeChange('shoe')}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${sizeType === 'shoe' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
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
                                                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all ${selectedSizes.includes(size) ? 'bg-black border-black text-white shadow-md scale-105' : 'bg-white border-gray-200 text-gray-600 hover:border-black'
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
                                                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all ${selectedSizes.includes(size) ? 'bg-black border-black text-white shadow-md scale-105' : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                                                            }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {form.variants.length > 0 && (
                                    <div className="pt-8 border-t border-gray-50">
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

                        {/* Section 4: Description */}
                        <div className="space-y-6 pt-2">
                            <div className="border-l-2 border-black pl-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Mô tả sản phẩm *</h3>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả ngắn *</label>
                                    <input
                                        type="text" name="short_description" value={form.short_description} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chi tiết sản phẩm *</label>
                                    <textarea
                                        name="description" value={form.description} onChange={handleChange} rows={6}
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-lg text-sm resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-6 border-t border-gray-100 flex gap-4 bg-white flex-none">
                    <button onClick={onClose} className="px-8 py-3.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Hủy bỏ</button>
                    <button
                        onClick={(e) => handleSubmit(e)} disabled={loading || uploading}
                        className="flex-1 px-8 py-3.5 bg-black text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
