import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';
import { fmtCompact, ChartTooltip, EmptyState } from './DashboardUtils';

const RevenueChart = ({ data }) => {
    return (
        <ChartContainer title="Monthly Revenue" className="lg:col-span-2">
            {data.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<ChartTooltip currency />} />
                        <Area
                            type="monotone" dataKey="Revenue"
                            stroke="#6366f1" strokeWidth={2.5}
                            fill="url(#gRevenue)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </ChartContainer>
    );
};

export default RevenueChart;
