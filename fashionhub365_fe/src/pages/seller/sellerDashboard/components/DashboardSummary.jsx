import React from 'react';
import StatCard from './StatCard';
import { fmtVND, fmtCompact } from './DashboardUtils';

const DashboardSummary = ({ summary }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Revenue"
                value={fmtCompact(summary.totalRevenue)}
                sub={fmtVND(summary.totalRevenue)}
                icon="💰"
                accent="bg-emerald-400"
            />
            <StatCard
                title="Paid Revenue"
                value={fmtCompact(summary.paidRevenue)}
                sub={fmtVND(summary.paidRevenue)}
                icon="✅"
                accent="bg-blue-400"
            />
            <StatCard
                title="Total Orders"
                value={(summary.totalOrders || 0).toLocaleString()}
                sub="All statuses"
                icon="📦"
                accent="bg-violet-400"
            />
            <StatCard
                title="Customers"
                value={(summary.totalUsers || 0).toLocaleString()}
                sub={`${summary.totalProducts || 0} products`}
                icon="👥"
                accent="bg-orange-400"
            />
        </div>
    );
};

export default DashboardSummary;
