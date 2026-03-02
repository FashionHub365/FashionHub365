import React, { useState } from 'react';
import { confirmOrder, cancelOrder, updateOrderStatus } from '../../../services/orderService';

const OrderActions = ({ order, onOrderUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const handleConfirm = async () => {
        if (!window.confirm('Xác nhận đơn hàng này?')) return;

        setLoading(true);
        try {
            await confirmOrder(order.uuid);
            alert('Đã xác nhận đơn hàng thành công!');
            onOrderUpdate();
        } catch (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            alert('Vui lòng nhập lý do hủy đơn');
            return;
        }

        setLoading(true);
        try {
            await cancelOrder(order.uuid, cancelReason);
            alert('Đã hủy đơn hàng thành công!');
            setShowCancelModal(false);
            setCancelReason('');
            onOrderUpdate();
        } catch (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Cập nhật trạng thái thành "${newStatus}"?`)) return;

        setLoading(true);
        try {
            await updateOrderStatus(order.uuid, newStatus, 'Cập nhật trạng thái');
            alert('Đã cập nhật trạng thái thành công!');
            onOrderUpdate();
        } catch (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                {order.status === 'created' && (
                    <>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            Hủy đơn
                        </button>
                    </>
                )}

                {order.status === 'confirmed' && (
                    <button
                        onClick={() => handleStatusUpdate('shipping')}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {loading ? 'Đang xử lý...' : 'Bắt đầu giao hàng'}
                    </button>
                )}

                {order.status === 'shipping' && (
                    <button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {loading ? 'Đang xử lý...' : 'Hoàn thành'}
                    </button>
                )}
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hủy đơn hàng</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vui lòng nhập lý do hủy đơn hàng #{order.uuid?.substring(0, 8)}
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows="4"
                            placeholder="Nhập lý do hủy đơn..."
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading || !cancelReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderActions;