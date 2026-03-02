import React, { useState } from 'react';

const DeleteConfirmModal = ({ product, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    const [inputVal, setInputVal] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(product._id);
            onClose();
        } catch (err) {
            alert('Lỗi khi xóa: ' + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Xóa sản phẩm?</h2>
                    <p className="text-sm text-gray-500">
                        Bạn sắp xóa sản phẩm <span className="font-semibold text-gray-700">"{product.name}"</span>.
                        Hành động này <span className="text-red-600 font-medium">không thể hoàn tác</span>.
                    </p>
                </div>

                {/* Confirm input */}
                <div className="px-6 pb-4">
                    <p className="text-xs text-gray-500 mb-2">Nhập <strong>XOA</strong> để xác nhận:</p>
                    <input
                        type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                        placeholder="Nhập XOA"
                    />
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                        Hủy
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading || inputVal !== 'XOA'}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
