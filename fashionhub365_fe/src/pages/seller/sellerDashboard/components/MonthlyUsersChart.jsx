import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';
import { ChartTooltip, EmptyState } from './DashboardUtils';

const MonthlyUsersChart = ({ data }) => {
    return (
        <ChartContainer title="Monthly New Customers">
            {data.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="New Users" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </ChartContainer>
    );
};

export default MonthlyUsersChart;
