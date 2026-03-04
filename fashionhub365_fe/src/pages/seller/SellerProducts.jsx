import React, { useState, useEffect, useCallback } from 'react';
import { getSellerProducts, updateProduct, deleteProduct, toggleStockStatus, createProduct, getCategories } from '../../services/productService';
import EditProductModal from './components/EditProductModal';
import CreateProductModal from './components/CreateProductModal';
import Swal from 'sweetalert2';

const STATUS_CONFIG = {
    all: { label: 'Tất cả', className: '' },
    draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-600' },
    active: { label: 'Đang bán', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Hết hàng', className: 'bg-red-100 text-red-700' },
    blocked: { label: 'Bị khóa', className: 'bg-orange-100 text-orange-700' },
};

const formatCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const SellerProducts = () => {
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    const loadInitialData = useCallback(async () => {
        try {
            const catRes = await getCategories();
            setCategories(catRes.data || catRes || []);
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    }, []);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (search) params.search = search;
            if (categoryFilter !== 'all') params.primary_category_id = categoryFilter;

            const data = await getSellerProducts(params);
            // Handle both { data: { products, total } } and { products, total } formats
            const result = data.data || data;
            setProducts(result.products || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search, categoryFilter]);

    useEffect(() => { 
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => { 
        loadProducts(); 
    }, [loadProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleCreate = async (data) => {
        try {
            await createProduct(data);
            setSearch('');
            setSearchInput('');
            setStatusFilter('all');
            setCategoryFilter('all');
            // State updates will trigger useEffect -> loadProducts
        } catch (err) {
            console.error('Error creating product:', err);
            throw err;
        }
    };

    const handleUpdate = async (id, data) => {
        await updateProduct(id, data);
        loadProducts();
    };

    const confirmDelete = async (product) => {
        const result = await Swal.fire({
            title: 'Xóa sản phẩm?',
            html: `Bạn sắp xóa sản phẩm <b>"${product.name}"</b>.<br/>Hành động này <b>không thể hoàn tác</b>.<br/><br/>Nhập <b>XOA</b> để xác nhận:`,
            icon: 'warning',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xác nhận xóa',
            cancelButtonText: 'Hủy',
            reverseButtons: true,
            preConfirm: (value) => {
                if (value !== 'XOA') {
                    Swal.showValidationMessage('Vui lòng nhập chính xác chữ "XOA"');
                    return false;
                }
                return true;
            }
        });

        if (result.isConfirmed) {
            try {
                await deleteProduct(product._id);
                loadProducts();
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Sản phẩm đã được xóa thành công.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire(
                    'Lỗi!',
                    'Có lỗi xảy ra khi xóa sản phẩm.',
                    'error'
                );
            }
        }
    };

    const handleToggleStock = async (product) => {
        setTogglingId(product._id);
        try {
            await toggleStockStatus(product._id);
            loadProducts();
        } catch (err) {
            alert('Lỗi khi đổi trạng thái: ' + err.message);
        } finally {
            setTogglingId(null);
        }
    };

    const primaryImage = (product) => {
        const primary = product.media?.find((m) => m.isPrimary) || product.media?.[0];
        return primary?.url || null;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Hiện có {total} sản phẩm
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Đăng sản phẩm mới
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                    <div className="flex flex-col lg:flex-row gap-5">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text" value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Tìm kiếm sản phẩm theo tên..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <button type="submit"
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold shadow-sm">
                                Tìm kiếm
                            </button>
                        </form>

                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Category filter */}
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                            >
                                <option value="all">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>

                            {/* Status filter tabs */}
                            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                    <button key={key}
                                        onClick={() => setStatusFilter(key)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${statusFilter === key
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">�</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                            <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Sản phẩm</th>
                                        <th className="text-right font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Giá bán</th>
                                        <th className="text-center font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Biến thể</th>
                                        <th className="text-center font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Trạng thái</th>
                                        <th className="text-center font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Công khai</th>
                                        <th className="text-center font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product) => {
                                        const img = primaryImage(product);
                                        const cfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft;
                                        const isInactive = product.status === 'inactive';
                                        const isToggling = togglingId === product._id;

                                        return (
                                            <tr key={product._id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-200 shadow-sm">
                                                            {img ? (
                                                                <img src={img} alt={product.name}
                                                                    className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-3xl">👗</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 truncate max-w-[200px] md:max-w-xs">{product.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase">#{product.uuid?.substring(0, 8)}</span>
                                                                {product.primary_category_id && (
                                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                                                        {categories.find(c => c._id === product.primary_category_id)?.name || 'Danh mục'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-gray-900">
                                                    {formatCurrency(product.base_price)}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-bold">
                                                        {product.variants?.length || 0} loại
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.className}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() => handleToggleStock(product)}
                                                        disabled={isToggling || product.status === 'blocked'}
                                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all focus:outline-none disabled:opacity-40 ${isInactive ? 'bg-gray-300' : 'bg-green-500'
                                                            }`}>
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${isInactive ? 'translate-x-1' : 'translate-x-6'
                                                            }`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditProduct(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(product)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCreateOpen && (
                <CreateProductModal
                    onClose={() => setIsCreateOpen(false)}
                    onSave={handleCreate}
                />
            )}
            {editProduct && (
                <EditProductModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
};

export default SellerProducts;
