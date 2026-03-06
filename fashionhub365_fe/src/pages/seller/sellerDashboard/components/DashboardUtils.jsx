import React from 'react';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const STATUS_COLORS = {
    created: '#818cf8',
    confirmed: '#60a5fa',
    shipped: '#a78bfa',
    delivered: '#34d399',
    cancelled: '#f87171',
    refunded: '#fbbf24',
};

export const STATUS_LABELS = {
    created: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

export const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export const fmtCompact = (v) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(v || 0) + '₫';

export const ChartTooltip = ({ active, payload, label, currency }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
            <p className="font-semibold mb-1 text-gray-300">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold text-white">
                        {currency ? fmtVND(p.value) : p.value.toLocaleString()}
                    </span>
                </p>
            ))}
        </div>
    );
};

export const EmptyState = () => (
    <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
        No data available
    </div>
);
