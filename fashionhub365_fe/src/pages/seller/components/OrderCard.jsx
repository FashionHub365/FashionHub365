import React, { useState } from 'react';
import OrderStatusBadge from './OrderStatusBadge';
import OrderActions from './OrderActions';
import OrderDetailModal from './OrderDetailModal';


const OrderCard = ({ order, onOrderUpdate }) => {
    const [showDetail, setShowDetail] = useState(false);

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
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    #{order.uuid?.substring(0, 8) || 'N/A'}
                                </h3>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-sm text-gray-500">
                                <span className="font-medium">Đặt lúc:</span> {formatDate(order.created_at)}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDetail(true)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                            <p className="text-sm font-medium text-gray-900">
                                {order.customer_name || 'Không có tên'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                            <p className="text-sm font-medium text-gray-900">
                                {order.customer_phone || 'Không có SĐT'}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng</p>
                            <p className="text-sm font-medium text-gray-900">
                                {order.shipping_address || 'Không có địa chỉ'}
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">SẢN PHẨM</p>
                        <div className="space-y-2">
                            {order.items?.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                            📦
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                                            <p className="text-xs text-gray-500">
                                                Size: {item.size} | Màu: {item.color}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">x{item.quantity}</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                                    </div>
                                </div>
                            ))}
                            {order.items?.length > 3 && (
                                <button
                                    onClick={() => setShowDetail(true)}
                                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                                >
                                    + Xem thêm {order.items.length - 3} sản phẩm
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(order.total_amount || 0)}
                            </p>
                        </div>
                        <OrderActions order={order} onOrderUpdate={onOrderUpdate} />
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetail && (
                <OrderDetailModal
                    order={order}
                    onClose={() => setShowDetail(false)}
                    onOrderUpdate={onOrderUpdate}
                />
            )}
        </>
    );
};

export default OrderCard;