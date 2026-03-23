import React, { useState, useEffect } from 'react';
import voucherApi from '../../../apis/voucherApi';
import { confirmAction, showSuccess, showError } from '../../../utils/swalUtils';

const AdminVouchersPage = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: '',
        min_order_amount: '',
        start_date: '',
        end_date: '',
        usage_limit: ''
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await voucherApi.getVouchers();
            if (res.success || res.data?.success) {
                setVouchers(res.data?.items || res.data?.results || res.data?.data || res.data || res.items || []);
            }
        } catch (err) {
            setError('Failed to load vouchers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (voucher = null) => {
        if (voucher) {
            setEditingVoucher(voucher);
            setFormData({
                code: voucher.code,
                description: voucher.description || '',
                discount_type: voucher.discount_type,
                discount_value: voucher.discount_value,
                min_order_amount: voucher.min_order_amount || 0,
                start_date: voucher.start_date ? new Date(voucher.start_date).toISOString().split('T')[0] : '',
                end_date: voucher.end_date ? new Date(voucher.end_date).toISOString().split('T')[0] : '',
                usage_limit: voucher.usage_limit || 1
            });
        } else {
            setEditingVoucher(null);
            setFormData({
                code: '',
                description: '',
                discount_type: 'percent',
                discount_value: '',
                min_order_amount: '',
                start_date: '',
                end_date: '',
                usage_limit: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVoucher(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVoucher) {
                await voucherApi.updateVoucher(editingVoucher._id, formData);
            } else {
                await voucherApi.createVoucher(formData);
            }
            closeModal();
            showSuccess('Thông tin Voucher đã được lưu thành công.');
            fetchVouchers();
        } catch (err) {
            showError('Lỗi khi lưu Voucher. Mã voucher có thể đã tồn tại.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmAction({
            title: 'Xóa Voucher',
            text: 'Bạn có chắc chắn muốn xóa Voucher này không?',
            icon: 'warning'
        });

        if (isConfirmed) {
            try {
                await voucherApi.deleteVoucher(id);
                showSuccess('Đã xóa Voucher thành công.');
                fetchVouchers();
            } catch (err) {
                showError('Lỗi khi xóa Voucher.');
                console.error(err);
            }
        }
    };

    return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Voucher Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Create and manage discount codes.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                    + Add Voucher
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
                    {error}
                </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-3 text-left">Code</th>
                            <th className="px-4 py-3 text-left">Discount</th>
                            <th className="px-4 py-3 text-right">Min Order</th>
                            <th className="px-4 py-3 text-center">Usage Limit</th>
                            <th className="px-4 py-3 text-left">Validity</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="px-4 py-4 text-slate-500 text-center" colSpan={6}>Loading...</td>
                            </tr>
                        ) : vouchers.length === 0 ? (
                            <tr>
                                <td className="px-4 py-4 text-slate-500 text-center" colSpan={6}>No vouchers found.</td>
                            </tr>
                        ) : (
                            vouchers.map((voucher) => (
                                <tr key={voucher._id} className="border-t border-slate-100 text-left hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900 bg-slate-200 inline-block px-2 py-1 rounded">{voucher.code}</p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{voucher.description}</p>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-indigo-600">
                                        {voucher.discount_type === 'percent'
                                            ? `${voucher.discount_value}%`
                                            : `${Number(voucher.discount_value).toLocaleString('vi-VN')}₫`}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-700">
                                        {Number(voucher.min_order_amount || 0).toLocaleString('vi-VN')}₫
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-slate-800 font-medium">{voucher.used_count || 0}</span>
                                        <span className="text-slate-400"> / {voucher.usage_limit}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                        <div>From: {voucher.start_date ? new Date(voucher.start_date).toLocaleDateString('vi-VN') : '-'}</div>
                                        <div>To: {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString('vi-VN') : '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => openModal(voucher)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(voucher._id)}
                                            className="text-rose-600 hover:text-rose-900 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Voucher Code</label>
                                    <input
                                        type="text" name="code" value={formData.code} onChange={handleInputChange} required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                                        placeholder="E.g., SUMMER50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text" name="description" value={formData.description} onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Brief description of the voucher"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                                        <select
                                            name="discount_type" value={formData.discount_type} onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            <option value="percent">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₫)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Value</label>
                                        <input
                                            type="number" name="discount_value" value={formData.discount_value} onChange={handleInputChange} required min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Min Order Amount (₫)</label>
                                        <input
                                            type="number" name="min_order_amount" value={formData.min_order_amount} onChange={handleInputChange} min="0"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Usage Limit</label>
                                        <input
                                            type="number" name="usage_limit" value={formData.usage_limit} onChange={handleInputChange} required min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                                    <button
                                        type="button" onClick={closeModal}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 font-semibold rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Save Voucher
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminVouchersPage;
