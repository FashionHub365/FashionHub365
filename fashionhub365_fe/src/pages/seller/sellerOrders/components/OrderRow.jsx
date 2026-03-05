import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { fmtVND, fmtDate, STATUS_CONFIG } from './OrderUtils';

const OrderRow = ({ order, onOrderUpdate }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                onClick={() => setExpanded(p => !p)}
            >
                <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            #{String(order._id || order.id || '').slice(-6).toUpperCase()}
                        </span>
                    </div>
                </td>
                <td className="py-3.5 px-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            {order.buyer?.name || order.user?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">{order.buyer?.email || order.user?.email || ''}</p>
                    </div>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500">{fmtDate(order.createdAt)}</td>
                <td className="py-3.5 px-4">
                    <p className="text-sm font-bold text-gray-900">{fmtVND(order.totalAmount || order.total)}</p>
                </td>
                <td className="py-3.5 px-4">
                    <StatusBadge status={order.status} />
                </td>
                <td className="py-3.5 px-4 text-right">
                    <span className={`text-gray-400 transition-transform inline-block text-xs ${expanded ? 'rotate-180' : ''}`}>▼</span>
                </td>
            </tr>

            {/* Expanded detail row */}
            {expanded && (
                <tr className="bg-indigo-50/30 border-b border-gray-100">
                    <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Items */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sản phẩm</p>
                                <div className="space-y-1.5">
                                    {(order.items || order.products || []).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                {item.image && (
                                                    <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                                                )}
                                                <div>
                                                    <p className="text-xs font-medium text-gray-800">{item.name || item.productName || '—'}</p>
                                                    <p className="text-[11px] text-gray-400">x{item.quantity || 1}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-700">{fmtVND((item.price || 0) * (item.quantity || 1))}</p>
                                        </div>
                                    ))}
                                    {!(order.items || order.products || []).length && (
                                        <p className="text-xs text-gray-400 italic">Không có sản phẩm</p>
                                    )}
                                </div>
                            </div>

                            {/* Shipping + actions */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Giao hàng</p>
                                    <div className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm text-xs text-gray-600 space-y-1">
                                        <p>📍 {order.shippingAddress?.address || order.address || '—'}</p>
                                        {order.shippingAddress?.phone && <p>📞 {order.shippingAddress.phone}</p>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cập nhật trạng thái</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(STATUS_CONFIG)
                                            .filter(([k]) => k !== 'all' && k !== order.status)
                                            .map(([key, cfg]) => (
                                                <button key={key}
                                                    onClick={(e) => { e.stopPropagation(); onOrderUpdate && onOrderUpdate(order._id || order.id, key); }}
                                                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm"
                                                    style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.dot + '55' }}>
                                                    {cfg.label}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default OrderRow;
