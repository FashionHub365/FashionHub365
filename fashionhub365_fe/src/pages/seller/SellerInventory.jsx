import React, { useState, useEffect, useMemo } from 'react';
import inventoryApi from '../../apis/inventoryApi';
import { showSuccess, showError } from '../../utils/swalUtils';

const SellerInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adjustingId, setAdjustingId] = useState(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);
    const [expandedProducts, setExpandedProducts] = useState(new Set());

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getInventory();
            const result = response?.data || response;
            setInventory(result?.items || []);
            setError(null);
        } catch (err) {
            setError('Failed to load inventory data');
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const toggleExpand = (productId) => {
        const newExpanded = new Set(expandedProducts);
        if (newExpanded.has(productId)) {
            newExpanded.delete(productId);
        } else {
            newExpanded.add(productId);
        }
        setExpandedProducts(newExpanded);
    };

    // Group inventory by product and calculate stats
    const { groupedInventory, stats } = useMemo(() => {
        const grouped = inventory.reduce((acc, item) => {
            const prodId = item.product_id?._id || 'unknown';
            if (!acc[prodId]) {
                acc[prodId] = {
                    product: item.product_id,
                    items: [],
                    totalAvailable: 0,
                    totalReserved: 0,
                    isLowStock: false
                };
            }
            acc[prodId].items.push(item);

            const available = item.quantity - (item.reserved_quantity || 0);
            acc[prodId].totalAvailable += available;
            acc[prodId].totalReserved += (item.reserved_quantity || 0);

            if (available <= (item.low_stock_threshold || 5)) {
                acc[prodId].isLowStock = true;
            }
            return acc;
        }, {});

        const lowStockCount = inventory.filter(item =>
            (item.quantity - (item.reserved_quantity || 0)) <= (item.low_stock_threshold || 5)
        ).length;

        const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

        return {
            groupedInventory: Object.values(grouped),
            stats: {
                totalProducts: Object.keys(grouped).length,
                totalVariants: inventory.length,
                lowStockCount,
                totalItems
            }
        };
    }, [inventory]);

    const handleAdjust = async (id) => {
        if (!adjustmentAmount || isNaN(adjustmentAmount)) return;

        try {
            await inventoryApi.adjustInventory(id, Number(adjustmentAmount));
            showSuccess('Đã cập nhật số lượng tồn kho thành công!');
            setAdjustingId(null);
            setAdjustmentAmount(0);
            fetchInventory();
        } catch (err) {
            showError('Lỗi khi cập nhật kho hàng: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-6 text-gray-400 animate-in fade-in duration-700">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-black/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Đang đồng bộ kho hàng...</p>
        </div>
    );

    if (error) return (
        <div className="p-12 max-w-lg mx-auto text-center bg-white rounded-3xl border border-red-50 shadow-2xl shadow-red-500/5 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 mt-10">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-sm font-medium text-gray-400 leading-relaxed">{error}</p>
            <button onClick={fetchInventory} className="w-full py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95">Tải lại trang</button>
        </div>
    );

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Quản lý Kho hàng</h2>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 ml-1">FashionHub365 Inventory System</p>
                </div>
                <button
                    onClick={fetchInventory}
                    className="group flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Làm mới dữ liệu
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng sản phẩm', value: stats.totalProducts, detail: `${stats.totalVariants} biến thể`, icon: '📦', color: 'bg-blue-50' },
                    { label: 'Cần nhập hàng', value: stats.lowStockCount, detail: 'Dưới mức tối thiểu', icon: '⚠️', color: 'bg-red-50', highlight: stats.lowStockCount > 0 },
                    { label: 'Tồn kho thực tế', value: stats.totalItems, detail: 'Lưu tại kho hàng', icon: '📉', color: 'bg-emerald-50' },
                    { label: 'Đang giữ chỗ', value: inventory.reduce((s, i) => s + (i.reserved_quantity || 0), 0), detail: 'Chờ giao cho khách', icon: '🕒', color: 'bg-orange-50' }
                ].map((stat, i) => (
                    <div key={i} className={`group relative bg-white p-8 rounded-[2rem] border transition-all duration-500 ${stat.highlight ? 'border-red-200 ring-8 ring-red-500/5' : 'border-gray-100 hover:border-black hover:shadow-2xl hover:shadow-gray-200/50'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                {stat.icon}
                            </div>
                            {stat.highlight && <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">Cảnh báo</div>}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value.toLocaleString()}</h3>
                            <p className="text-[10px] font-bold text-gray-300 italic">{stat.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content List: One Group per "Island" */}
            <div className="space-y-12">
                {groupedInventory.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl grayscale opacity-30">📭</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Chưa có sản phẩm</h3>
                        <p className="mt-2 text-sm text-gray-400 font-medium">Danh sách kho hàng của bạn đang trống.</p>
                    </div>
                ) : (
                    groupedInventory.map((group) => {
                        const prodId = group.product?._id || 'unknown';
                        const isExpanded = expandedProducts.has(prodId);
                        const product = group.product;
                        const firstImg = product?.media?.[0]?.url;

                        return (
                            <div key={prodId} className={`group relative rounded-[3rem] transition-all duration-500 ${isExpanded ? 'bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] ring-1 ring-black/5' : 'bg-white hover:shadow-xl hover:shadow-gray-200/40 border border-gray-100'}`}>
                                {/* Product Summary Card (Header of the island) */}
                                <div
                                    className={`p-8 cursor-pointer rounded-[3rem] transition-colors duration-500 ${isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                                    onClick={() => toggleExpand(prodId)}
                                >
                                    <div className="flex flex-col lg:flex-row items-center gap-10">
                                        {/* Product Info Left */}
                                        <div className="flex items-center gap-8 flex-1 w-full lg:w-auto">
                                            <div className="relative w-24 h-24 flex-shrink-0 rounded-[2rem] overflow-hidden bg-gray-100 shadow-xl border-4 border-white">
                                                {firstImg ? (
                                                    <img src={firstImg} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300 font-black">NO IMG</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-none group-hover:text-black transition-colors uppercase">
                                                    {product?.name || 'Sản phẩm không xác định'}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {group.items.length} BIẾN THỂ
                                                    </span>
                                                    {group.isLowStock && (
                                                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                                                            Sắp hết hàng
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Row Center */}
                                        <div className="flex items-center gap-16 lg:px-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-x border-gray-100 pt-6 lg:pt-0">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">CÓ SẴN</span>
                                                <span className="text-2xl font-black text-gray-900 tracking-tighter">{group.totalAvailable}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">ĐÃ ĐẶT</span>
                                                <span className={`text-2xl font-black tracking-tighter ${group.totalReserved > 0 ? 'text-orange-500' : 'text-gray-900'}`}>{group.totalReserved}</span>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-center">
                                                <span className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">TRẠNG THÁI</span>
                                                <div className={`mt-1 w-3 h-3 rounded-full ${group.isLowStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                            </div>
                                        </div>

                                        {/* Action Right */}
                                        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                                            <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-black group-hover:text-white'}`}>
                                                {isExpanded ? 'Đóng chi tiết' : 'Xem chi tiết'}
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-black border-black text-white rotate-180' : 'bg-white border-gray-200 text-gray-400'}`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Variant Detail List (Body of the island) */}
                                {isExpanded && (
                                    <div className="px-8 pb-10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {/* Minimal Table Header for Variants */}
                                        <div className="flex items-center px-6 py-2 ml-16 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                            <div className="flex-1">THÔNG TIN BIẾN THỂ</div>
                                            <div className="w-24 text-center">SẴN CÓ</div>
                                            <div className="w-24 text-center">ĐÃ ĐẶT</div>
                                            <div className="w-48 text-right">ĐIỀU CHỈNH KHO</div>
                                        </div>

                                        {group.items.map((item, idx) => {
                                            const variant = item.product_id?.variants?.find((v) => String(v._id) === String(item.variant_id));
                                            const color = variant?.attributes?.color || variant?.attributes?.Color;
                                            const size = variant?.attributes?.size || variant?.attributes?.Size || variant?.attributes?.['kích cỡ'];

                                            const available = item.quantity - (item.reserved_quantity || 0);
                                            const isLow = available <= (item.low_stock_threshold || 5);

                                            return (
                                                <div key={item._id} className="group/item flex items-center px-8 py-5 bg-white border border-gray-100 rounded-[2rem] hover:border-black transition-all">
                                                    {/* Visual Linkage */}
                                                    <div className="w-16 flex-shrink-0 flex items-center justify-center relative">
                                                        <div className="absolute left-1/2 top-[-2rem] bottom-0 w-px bg-gray-200"></div>
                                                        <div className="w-3 h-3 rounded-full border-2 border-gray-200 bg-white z-10 group-hover/item:border-black transition-colors"></div>
                                                    </div>

                                                    {/* Variant Info */}
                                                    <div className="flex-1 flex flex-col min-w-0">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">
                                                            SKU: {variant?.sku || 'SKU-NONE'}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            {color && (
                                                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-600 border border-gray-100">
                                                                    MÀU: <span className="text-black">{color}</span>
                                                                </span>
                                                            )}
                                                            {size && (
                                                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-600 border border-gray-100">
                                                                    SIZE: <span className="text-black">{size}</span>
                                                                </span>
                                                            )}
                                                            {!color && !size && <span className="text-xs font-bold text-gray-500 uppercase">{variant?.variantName || 'MẶC ĐỊNH'}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Available */}
                                                    <div className="w-24 flex items-center justify-center flex-col">
                                                        <span className={`text-lg font-black tracking-tighter ${isLow ? 'text-red-500' : 'text-gray-900'}`}>{available}</span>
                                                        {isLow && <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter leading-none">Cần nhập</span>}
                                                    </div>

                                                    {/* Reserved */}
                                                    <div className="w-24 text-center text-sm font-bold text-gray-300">
                                                        {item.reserved_quantity || 0}
                                                    </div>

                                                    {/* Action */}
                                                    <div className="w-48 flex justify-end">
                                                        {adjustingId === item._id ? (
                                                            <div className="flex items-center bg-black rounded-2xl p-1 shadow-2xl animate-in slide-in-from-right-3">
                                                                <input
                                                                    type="number"
                                                                    className="w-16 bg-transparent text-white text-center text-sm font-black outline-none placeholder:text-gray-600"
                                                                    placeholder="0"
                                                                    value={adjustmentAmount}
                                                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleAdjust(item._id)}
                                                                    className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-colors"
                                                                >
                                                                    LƯU
                                                                </button>
                                                                <button onClick={() => setAdjustingId(null)} className="p-2 text-white/50 hover:text-white transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setAdjustingId(item._id); }}
                                                                className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-gray-100 rounded-2xl text-[9px] font-black text-gray-400 hover:border-black hover:text-black hover:shadow-lg transition-all"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                                                ĐIỀU CHỈNH
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Tips */}
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 p-8 bg-black rounded-[3rem] text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl">💡</div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Mẹo quản lý tập trung</h4>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed font-medium mb-0">
                        Hệ thống đã tự động gộp các biến thể cùng loại. Nhấn vào ô sản phẩm để mở rộng danh sách chi tiết. Ưu tiên xử lý các sản phẩm có nhãn <span className="text-red-500 font-black">SẮP HẾT HÀNG</span> để tránh mất doanh số bán hàng.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SellerInventory;
