import React from 'react';
import OrderRow from './OrderRow';

const OrderList = ({ orders, onOrderUpdate }) => {
    if (!orders.length) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-semibold">Không có đơn hàng nào</p>
            <p className="text-xs text-gray-400 mt-1">Thử chọn bộ lọc khác</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                            {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', ''].map((h) => (
                                <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <OrderRow
                                key={order._id || order.id}
                                order={order}
                                onOrderUpdate={onOrderUpdate}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
                Hiển thị {orders.length} đơn hàng
            </div>
        </div>
    );
};

export default OrderList;
