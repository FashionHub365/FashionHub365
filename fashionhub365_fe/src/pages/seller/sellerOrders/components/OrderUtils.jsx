import React from 'react';

export const STATUS_CONFIG = {
    all: { label: 'All', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
    created: { label: 'Pending', color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
    confirmed: { label: 'Confirmed', color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
    shipped: { label: 'Shipped', color: '#0369a1', bg: '#f0f9ff', dot: '#0ea5e9' },
    delivered: { label: 'Delivered', color: '#065f46', bg: '#ecfdf5', dot: '#10b981' },
    cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fff1f2', dot: '#f43f5e' },
    refunded: { label: 'Refunded', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
};

export const STAT_CARDS = [
    { key: 'total', label: 'Total Orders', icon: '🗂️', compute: (o) => o.length },
    { key: 'delivered', label: 'Delivered', icon: '✅', compute: (o) => o.filter(x => x.status === 'delivered').length },
    { key: 'shipped', label: 'Shipped', icon: '🚚', compute: (o) => o.filter(x => x.status === 'shipped').length },
    { key: 'cancelled', label: 'Cancelled', icon: '❌', compute: (o) => o.filter(x => x.status === 'cancelled').length },
];

export const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
