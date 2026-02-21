import OrderActions from "./OrderActions";
import OrderStatusBadge from "./OrderStatusBadge";

const OrderDetailModal = ({ order, onClose, onOrderUpdate }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Chi tiết đơn hàng #{order.uuid?.substring(0, 8)}
                        </h2>
                        <div className="flex items-center gap-3">
                            <OrderStatusBadge status={order.status} />
                            <span className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Họ và tên</p>
                                <p className="text-base font-medium text-gray-900">
                                    {order.customer_name || 'Không có tên'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                                <p className="text-base font-medium text-gray-900">
                                    {order.customer_phone || 'Không có SĐT'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <p className="text-base font-medium text-gray-900">
                                    {order.customer_email || 'Không có email'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500 mb-1">Địa chỉ giao hàng</p>
                                <p className="text-base font-medium text-gray-900">
                                    {order.shipping_address || 'Không có địa chỉ'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đặt hàng</h3>
                        <div className="space-y-3">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-2xl">
                                        📦
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.product_name}</p>
                                        <p className="text-sm text-gray-500">
                                            Size: {item.size} | Màu: {item.color}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            SKU: {item.sku || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">x{item.quantity}</p>
                                        <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết thanh toán</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Tạm tính</span>
                                <span>{formatCurrency((order.total_amount || 0) - (order.shipping_fee || 0))}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Phí vận chuyển</span>
                                <span>{formatCurrency(order.shipping_fee || 0)}</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Giảm giá</span>
                                    <span>-{formatCurrency(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-300 pt-3 flex justify-between text-lg font-bold text-gray-900">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(order.total_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Phương thức thanh toán</span>
                                <span className="font-medium">{order.payment_method || 'COD'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.status_history && order.status_history.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử trạng thái</h3>
                            <div className="space-y-3">
                                {order.status_history.map((history, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {history.oldStatus} → {history.newStatus}
                                            </p>
                                            <p className="text-sm text-gray-600">{history.note}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Bởi: {history.changedBy} | {formatDate(history.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Đóng
                        </button>
                        <OrderActions order={order} onOrderUpdate={() => {
                            onOrderUpdate();
                            onClose();
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;