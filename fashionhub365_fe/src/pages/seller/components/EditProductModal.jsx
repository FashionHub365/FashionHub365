import React, { useState } from 'react';

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
        base_price: product.base_price || 0,
        status: product.status || 'draft',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Tên sản phẩm không được để trống'); return; }
        if (Number(form.base_price) <= 0) { setError('Giá phải lớn hơn 0'); return; }

        setLoading(true);
        setError('');
        try {
            await onSave(product._id, {
                ...form,
                base_price: Number(form.base_price),
            });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa sản phẩm</h2>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                        <input
                            type="text" name="name" value={form.name} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Nhập tên sản phẩm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                        <input
                            type="text" name="short_description" value={form.short_description} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Mô tả ngắn gọn"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                            placeholder="Mô tả chi tiết sản phẩm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản (VND) *</label>
                            <input
                                type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                name="status" value={form.status} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                            >
                                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductModal;
