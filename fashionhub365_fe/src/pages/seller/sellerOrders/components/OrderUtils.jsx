import React from 'react';

export const STATUS_CONFIG = {
    all: { label: 'Tất cả', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
    created: { label: 'Chờ xử lý', color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
    confirmed: { label: 'Xác nhận', color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
    shipped: { label: 'Vận chuyển', color: '#0369a1', bg: '#f0f9ff', dot: '#0ea5e9' },
    delivered: { label: 'Hoàn thành', color: '#065f46', bg: '#ecfdf5', dot: '#10b981' },
    cancelled: { label: 'Đã huỷ', color: '#991b1b', bg: '#fff1f2', dot: '#f43f5e' },
    refunded: { label: 'Hoàn tiền', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
};

export const STAT_CARDS = [
    { key: 'total', label: 'Tổng đơn', icon: '🗂️', compute: (o) => o.length },
    { key: 'delivered', label: 'Hoàn thành', icon: '✅', compute: (o) => o.filter(x => x.status === 'delivered').length },
    { key: 'shipped', label: 'Đang giao', icon: '🚚', compute: (o) => o.filter(x => x.status === 'shipped').length },
    { key: 'cancelled', label: 'Đã huỷ', icon: '❌', compute: (o) => o.filter(x => x.status === 'cancelled').length },
];

export const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
