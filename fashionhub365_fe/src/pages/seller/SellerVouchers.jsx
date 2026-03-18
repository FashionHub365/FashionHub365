import React, { useState, useEffect } from 'react';
import voucherApi from '../../apis/voucherApi';
import { confirmAction, showSuccess, showError } from '../../utils/swalUtils';

const SellerVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // New Voucher Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percent', // 'percent' | 'fixed'
        discount_value: 0,
        min_order_value: 0,
        max_discount: 0, // only for percent
        usage_limit: 100,
        start_date: '',
        end_date: ''
    });

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await voucherApi.getVouchers();
            if (res.data?.success) {
                setVouchers(res.data.data.items);
            }
        } catch (err) {
            setError('Failed to load vouchers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['discount_value', 'min_order_value', 'max_discount', 'usage_limit'].includes(name)
                ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await voucherApi.createVoucher(formData);
            showSuccess('Voucher đã được tạo thành công!');
            setShowModal(false);
            fetchVouchers();
            // Reset form
            setFormData({
                code: '',
                description: '',
                discount_type: 'percent',
                discount_value: 0,
                min_order_value: 0,
                max_discount: 0,
                usage_limit: 100,
                start_date: '',
                end_date: ''
            });
        } catch (err) {
            showError('Không thể tạo Voucher: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmAction({
            title: 'Xóa Voucher',
            text: 'Bạn có chắc chắn muốn xóa Voucher này không?',
            icon: 'warning'
        });
        if (!isConfirmed) return;
        try {
            await voucherApi.deleteVoucher(id);
            showSuccess('Đã xóa Voucher thành công.');
            fetchVouchers();
        } catch (err) {
            showError('Không thể xóa Voucher.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading vouchers...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Store Vouchers</h2>
                    <p className="text-sm text-gray-500 mt-1">Create and manage discount codes</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Voucher
                </button>
            </div>

            {vouchers.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vouchers found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new discount code.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vouchers.map(v => (
                        <div key={v._id} className="relative bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {v.code}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {v.status}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mt-2">
                                {v.discount_type === 'percent' ? `${v.discount_value}% OFF` : `${v.discount_value.toLocaleString('vi-VN')}₫ OFF`}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{v.description}</p>

                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                                <p>Min order: {v.min_order_value.toLocaleString('vi-VN')}₫</p>
                                <p>Valid: {new Date(v.start_date).toLocaleDateString()} - {new Date(v.end_date).toLocaleDateString()}</p>
                                <p>Usage: {v.used_count || 0} / {v.usage_limit}</p>
                            </div>

                            <button
                                onClick={() => handleDelete(v._id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Voucher"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Create New Voucher</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="voucherForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Code</label>
                                        <input type="text" name="code" value={formData.code} onChange={handleChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <select name="discount_type" value={formData.discount_type} onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                            <option value="percent">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <input type="text" name="description" value={formData.description} onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Discount Value</label>
                                        <input type="number" name="discount_value" value={formData.discount_value} onChange={handleChange} required min="1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Min Order Value (₫)</label>
                                        <input type="number" name="min_order_value" value={formData.min_order_value} onChange={handleChange} required min="0"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    {formData.discount_type === 'percent' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Max Discount (₫)</label>
                                            <input type="number" name="max_discount" value={formData.max_discount} onChange={handleChange} min="0"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                                        <input type="number" name="usage_limit" value={formData.usage_limit} onChange={handleChange} required min="1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <input type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                        <input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" form="voucherForm" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">
                                Create Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerVouchers;
