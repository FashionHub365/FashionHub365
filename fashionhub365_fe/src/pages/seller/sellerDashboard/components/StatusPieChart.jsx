import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';
import { EmptyState } from './DashboardUtils';

const StatusPieChart = ({ data }) => {
    return (
        <ChartContainer title="Orders by Status">
            {data.length === 0 ? <EmptyState /> : (
                <>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={data} cx="50%" cy="50%"
                                innerRadius={44} outerRadius={72}
                                dataKey="value" paddingAngle={3} strokeWidth={0}
                            >
                                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip
                                formatter={(v, n) => [v + ' orders', n]}
                                contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', background: '#111827', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2 mt-2">
                        {data.map((d) => {
                            const total = data.reduce((s, x) => s + x.value, 0);
                            const pct = total ? Math.round((d.value / total) * 100) : 0;
                            return (
                                <div key={d.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                    <span className="text-[10px] text-gray-500 flex-1">{d.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-700 w-4 text-right">{d.value}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </ChartContainer>
    );
};

export default StatusPieChart;
