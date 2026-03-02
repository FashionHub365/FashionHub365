import React, { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/adminService';

// Modal: Tạo mới / Chỉnh sửa
const CategoryModal = ({ category, allCategories, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: category?.name || '',
        description: category?.description || '',
        parent_id: category?.parent_id?._id || category?.parent_id || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Tên danh mục không được để trống'); return; }
        setLoading(true); setError('');
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const parents = allCategories.filter(c => !category || c._id !== category._id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            placeholder="Ví dụ: Áo nam, Quần nữ..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                            placeholder="Mô tả ngắn về danh mục" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha (tuỳ chọn)</label>
                        <select name="parent_id" value={form.parent_id} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white">
                            <option value="">— Không có (danh mục gốc) —</option>
                            {parents.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50">
                            {loading ? 'Đang lưu...' : category ? 'Lưu thay đổi' : 'Tạo danh mục'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal xác nhận xóa
const DeleteModal = ({ category, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true); setError('');
        try {
            await onConfirm(category._id);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Lỗi khi xóa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Xóa danh mục?</h2>
                    <p className="text-sm text-gray-500">
                        Bạn sắp xóa <span className="font-semibold text-gray-700">"{category.name}"</span>.
                    </p>
                    {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleDelete} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50">
                        {loading ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Trang chính
const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCategories(search);
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { load(); }, [load]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleCreate = async (form) => {
        await createCategory(form);
        load();
    };

    const handleEdit = async (form) => {
        await updateCategory(editTarget._id, form);
        load();
    };

    const handleDelete = async (id) => {
        await deleteCategory(id);
        load();
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
                        <p className="text-sm text-gray-500 mt-1">{categories.length} danh mục</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm danh mục
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Tìm kiếm danh mục..." />
                        </div>
                        <button type="submit"
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                            Tìm
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-14">
                            <div className="text-5xl mb-3">🗂️</div>
                            <p className="text-gray-500">Chưa có danh mục nào</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3.5">Tên danh mục</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3.5">Danh mục cha</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3.5">Mô tả</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3.5">Ngày tạo</th>
                                    <th className="text-center text-xs font-semibold text-gray-500 uppercase px-6 py-3.5">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map((cat) => (
                                    <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {cat.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cat.parent_id ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                                                    {cat.parent_id.name || 'Có cha'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Gốc</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{cat.description || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500">{formatDate(cat.created_at)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setEditTarget(cat)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(cat)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreate && (
                <CategoryModal allCategories={categories} onClose={() => setShowCreate(false)} onSave={handleCreate} />
            )}
            {editTarget && (
                <CategoryModal category={editTarget} allCategories={categories} onClose={() => setEditTarget(null)} onSave={handleEdit} />
            )}
            {deleteTarget && (
                <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
            )}
        </div>
    );
};

export default AdminCategories;
