import React, { useState, useEffect } from 'react';
import { getStoreStats } from '../../../services/orderService';
import { MONTH_NAMES, STATUS_LABELS, STATUS_COLORS } from './components/DashboardUtils';
import DashboardSummary from './components/DashboardSummary';
import RevenueChart from './components/RevenueChart';
import StatusPieChart from './components/StatusPieChart';
import MonthlyOrdersChart from './components/MonthlyOrdersChart';
import MonthlyUsersChart from './components/MonthlyUsersChart';

const SellerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const data = await getStoreStats();
                setStats(data);
            } catch {
                setError('Could not load data. Please check backend connection.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center py-24">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-sm">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-red-600 font-semibold text-sm">{error}</p>
                <p className="text-xs text-red-400 mt-1">Restart the backend and try again</p>
            </div>
        </div>
    );

    /* ── Data prep ── */
    const monthlyChartData = (() => {
        const map = {};
        (stats.monthlyStats || []).forEach(({ _id, revenue, orders }) => {
            const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
            map[key] = { ...map[key], revenue, orders };
        });
        (stats.monthlyUsers || []).forEach(({ _id, count }) => {
            const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
            map[key] = { ...map[key], users: count };
        });
        return Object.entries(map).sort().map(([key, v]) => ({
            name: MONTH_NAMES[parseInt(key.split('-')[1]) - 1],
            Revenue: v.revenue || 0,
            Orders: v.orders || 0,
            'New Users': v.users || 0,
        }));
    })();

    const pieData = (stats.ordersByStatus || []).map(({ _id, count }) => ({
        name: STATUS_LABELS[_id] || _id,
        value: count,
        color: STATUS_COLORS[_id] || '#94a3b8',
    }));

    const { summary = {} } = stats;

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-6 animate-fadeIn">
            <DashboardSummary summary={summary} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <RevenueChart data={monthlyChartData} />
                <StatusPieChart data={pieData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MonthlyOrdersChart data={monthlyChartData} />
                <MonthlyUsersChart data={monthlyChartData} />
            </div>
        </div>
    );
};

export default SellerDashboard;
