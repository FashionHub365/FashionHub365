import React, { useState, useEffect, useRef } from 'react';
import storeApi from '../../apis/store.api';
import { toast } from 'react-toastify';
import { showSuccess, showError } from '../../utils/swalUtils';

const SellerStoreSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'info', 'contact'
    const [store, setStore] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: '',
        phone: '',
        slug: '',
    });

    const [previews, setPreviews] = useState({
        avatar: '',
        banner: '',
    });

    const [files, setFiles] = useState({
        avatar: null,
        banner: null,
    });

    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        fetchStoreData();
    }, []);

    const fetchStoreData = async () => {
        setLoading(true);
        try {
            const response = await storeApi.getMyStore();
            const storeData = response?.data?.store || response?.store || response?.data;
            if (storeData) {
                setStore(storeData);
                setFormData({
                    name: storeData.name || '',
                    description: storeData.description || '',
                    email: storeData.email || '',
                    phone: storeData.phone || '',
                    slug: storeData.slug || '',
                });
                setPreviews({
                    avatar: storeData.avatar_url || storeData.avatar || '',
                    banner: storeData.banner_url || storeData.banner || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch store data:', error);
            toast.error('Không thể tải thông tin cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setFiles(prev => ({ ...prev, [type]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!store?._id) return;

        setSaving(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            if (files.avatar) {
                submitData.append('avatar', files.avatar);
            }
            if (files.banner) {
                submitData.append('banner', files.banner);
            }

            const response = await storeApi.updateStore(store._id, submitData);
            if (response.success) {
                showSuccess('Cập nhật thành công', 'Các thiết lập cửa hàng đã được lưu lại!');
                fetchStoreData(); // Refresh to get final state
                setFiles({ avatar: null, banner: null });
            }
        } catch (error) {
            console.error('Update store error:', error);
            showError('Lỗi cập nhật', error.response?.data?.message || 'Không thể lưu thay đổi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600"></div>
                    <span className="text-sm font-medium text-slate-500">Đang tải dữ liệu cửa hàng...</span>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'branding', label: 'Thương hiệu', icon: '🎨' },
        { id: 'info', label: 'Thông tin chung', icon: '📝' },
        { id: 'contact', label: 'Liên hệ', icon: '📞' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Cài đặt Cửa hàng</h1>
                    <p className="text-slate-500 mt-1 max-w-2xl text-sm sm:text-base">
                        Xây dựng bộ nhận diện chuyên nghiệp để thu hút khách hàng và tối ưu hóa doanh thu.
                    </p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-70"
                >
                    {saving ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    <span>Lưu thay đổi</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Controls & Tabs */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Tabs Navigation */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Cards */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        {/* Branding Tab */}
                        {activeTab === 'branding' && (
                            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Hình ảnh nhận diện</h3>
                                    <p className="text-sm text-slate-500">Cập nhật logo và ảnh bìa để cửa hàng trông uy tín hơn.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Banner Control */}
                                    <div className="group relative">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Ảnh bìa (Banner)</label>
                                        <div
                                            onClick={() => bannerInputRef.current?.click()}
                                            className="relative h-44 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group-hover:border-indigo-400 transition-colors"
                                        >
                                            {previews.banner ? (
                                                <img src={previews.banner} className="w-full h-full object-cover" alt="Store Banner" />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-400">Khuyến nghị: 1200 x 400px</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold px-4 py-2 bg-indigo-600 rounded-lg shadow-lg">Thay đổi ảnh bìa</span>
                                            </div>
                                        </div>
                                        <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                    </div>

                                    {/* Avatar Control */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <div className="relative group shrink-0">
                                            <div
                                                onClick={() => avatarInputRef.current?.click()}
                                                className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
                                            >
                                                {previews.avatar ? (
                                                    <img src={previews.avatar} className="w-full h-full object-cover" alt="Store Avatar" />
                                                ) : (
                                                    <svg className="w-10 h-10 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                            </div>
                                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-800">Ảnh đại diện cửa hàng</h4>
                                            <p className="text-sm text-slate-500 max-w-sm">Dùng làm biểu tượng nhận diện trên tất cả các sản phẩm và tin nhắn. Khuyến nghị ảnh vuông (1:1).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Basic Info Tab */}
                        {activeTab === 'info' && (
                            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Tên cửa hàng</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium"
                                            placeholder="Tên shop của bạn..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Đường dẫn định danh (Slug)</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium"
                                            placeholder="my-cool-shop"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700">Tiểu sử / Mô tả cửa hàng</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium resize-none shadow-inner"
                                            placeholder="Kể cho khách hàng nghe câu chuyện thương hiệu của bạn..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Tab */}
                        {activeTab === 'contact' && (
                            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email hỗ trợ khách hàng</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium"
                                                placeholder="cskh@fashionhub365.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Số điện thoại liên hệ</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📞</span>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium"
                                                placeholder="09xx.xxx.xxx"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Live Preview Header */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Live Preview</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Thời gian thực</span>
                        </div>

                        {/* Mock Header Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transform transition-all hover:scale-[1.02] duration-300">
                            {/* Banner Area */}
                            <div className="h-28 relative bg-slate-800">
                                {previews.banner ? (
                                    <img src={previews.banner} className="w-full h-full object-cover opacity-60" alt="Preview Banner" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-800 opacity-60" />
                                )}
                                <div className="absolute inset-0 bg-black/20" />

                                {/* Badge overlay */}
                                <div className="absolute top-4 left-4 flex gap-1.5">
                                    <div className="bg-rose-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded">MALL</div>
                                    <div className="bg-amber-400 text-[8px] text-slate-900 font-black px-1.5 py-0.5 rounded">OFFICIAL</div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="relative pt-0 px-4 pb-4">
                                {/* Overlapping Avatar */}
                                <div className="absolute -top-10 left-4 w-20 h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100">
                                    <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center font-black text-2xl overflow-hidden shadow-inner text-indigo-600">
                                        {previews.avatar ? (
                                            <img src={previews.avatar} className="w-full h-full object-cover" alt="Preview Avatar" />
                                        ) : (
                                            (formData.name || 'S').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>

                                <div className="mt-12 space-y-3">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 leading-tight uppercase truncate">
                                            {formData.name || 'Tên Cửa Hàng'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang hoạt động</span>
                                        </div>
                                    </div>

                                    {/* Mock Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter cursor-default">+ Theo dõi</span>
                                        </div>
                                        <div className="h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter cursor-default">💬 Chat ngay</span>
                                        </div>
                                    </div>

                                    {/* Quick Stats mock */}
                                    <div className="pt-2 grid grid-cols-3 gap-1 border-t border-slate-100">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400">Sản phẩm</p>
                                            <p className="text-[11px] font-black text-slate-900">128</p>
                                        </div>
                                        <div className="text-center border-x border-slate-100 px-1">
                                            <p className="text-[9px] font-bold text-slate-400">Followers</p>
                                            <p className="text-[11px] font-black text-slate-900">2.5k</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400">Đánh giá</p>
                                            <p className="text-[11px] font-black text-slate-900">4.9★</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Preview snippet */}
                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase mb-2">Giới thiệu cửa hàng</h5>
                            <p className="text-xs text-indigo-900/70 italic leading-relaxed line-clamp-4">
                                {formData.description || 'Chưa có mô tả nào được nhập. Hãy chia sẻ thêm về mục tiêu và sản phẩm của bạn...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerStoreSettings;
