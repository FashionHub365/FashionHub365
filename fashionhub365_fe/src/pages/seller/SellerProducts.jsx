import React, { useState, useEffect, useCallback } from 'react';
import { getSellerProducts, updateProduct, deleteProduct, toggleStockStatus } from '../../services/productService';
import EditProductModal from './components/EditProductModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

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
    const [editProduct, setEditProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (search) params.search = search;
            const data = await getSellerProducts(params);
            setProducts(data.products || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleUpdate = async (id, data) => {
        await updateProduct(id, data);
        loadProducts();
    };

    const handleDelete = async (id) => {
        await deleteProduct(id);
        loadProducts();
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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {total} sản phẩm trong cửa hàng
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
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
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <button type="submit"
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                Tìm
                            </button>
                        </form>

                        {/* Status filter tabs */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                <button key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📦</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Không có sản phẩm</h3>
                            <p className="text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Sản phẩm</th>
                                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Giá</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Biến thể</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Trạng thái</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Hết hàng</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product) => {
                                        const img = primaryImage(product);
                                        const cfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft;
                                        const isInactive = product.status === 'inactive';
                                        const isToggling = togglingId === product._id;

                                        return (
                                            <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                                {/* Product info */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                            {img ? (
                                                                <img src={img} alt={product.name}
                                                                    className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">{product.name}</p>
                                                            {product.short_description && (
                                                                <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{product.short_description}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-0.5 font-mono">#{product.uuid?.substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Price */}
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.base_price)}</span>
                                                </td>

                                                {/* Variants */}
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                                                        {product.variants?.length || 0}
                                                    </span>
                                                </td>

                                                {/* Status badge */}
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>

                                                {/* Toggle out of stock */}
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleStock(product)}
                                                        disabled={isToggling || product.status === 'blocked'}
                                                        title={isInactive ? 'Đang hết hàng — nhấn để bật lại' : 'Đang bán — nhấn để tắt'}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${isInactive ? 'bg-gray-300' : 'bg-green-500'
                                                            }`}>
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isInactive ? 'translate-x-1' : 'translate-x-6'
                                                            }`} />
                                                    </button>
                                                    {isToggling && (
                                                        <div className="inline-block ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditProduct(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(product)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            {editProduct && (
                <EditProductModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSave={handleUpdate}
                />
            )}
            {deleteTarget && (
                <DeleteConfirmModal
                    product={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
};

export default SellerProducts;
