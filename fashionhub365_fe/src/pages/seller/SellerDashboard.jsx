import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getSystemStats } from '../../services/adminService';

const MONTH_NAMES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const STATUS_COLORS = {
    created: '#6366f1',
    confirmed: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    refunded: '#f59e0b',
};

const STATUS_LABELS = {
    created: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    refunded: 'Hoàn tiền',
};

const formatCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(v || 0) + 'đ';

const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const SellerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const data = await getSystemStats();
                setStats(data);
            } catch (err) {
                setError('Không thể tải dữ liệu. Kiểm tra kết nối BE.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-700 font-medium">{error}</p>
                <p className="text-sm text-red-500 mt-2">Hãy restart BE rồi thử lại</p>
            </div>
        </div>
    );

    // Chuẩn bị data cho biểu đồ
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
            'Doanh thu': v.revenue || 0,
            'Đơn hàng': v.orders || 0,
            'Người dùng mới': v.users || 0,
        }));
    })();

    const pieData = (stats.ordersByStatus || []).map(({ _id, count }) => ({
        name: STATUS_LABELS[_id] || _id,
        value: count,
        color: STATUS_COLORS[_id] || '#94a3b8',
    }));

    const { summary = {} } = stats;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động kinh doanh</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard
                        title="Tổng doanh thu"
                        value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.totalRevenue || 0)}
                        subtitle="Tất cả đơn hàng"
                        icon="💰"
                        color="bg-green-50"
                    />
                    <StatCard
                        title="Đã thanh toán"
                        value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.paidRevenue || 0)}
                        subtitle="Đơn paid"
                        icon="✅"
                        color="bg-blue-50"
                    />
                    <StatCard
                        title="Tổng đơn hàng"
                        value={(summary.totalOrders || 0).toLocaleString()}
                        subtitle="Tất cả trạng thái"
                        icon="📦"
                        color="bg-purple-50"
                    />
                    <StatCard
                        title="Người dùng"
                        value={(summary.totalUsers || 0).toLocaleString()}
                        subtitle={`${summary.totalProducts || 0} sản phẩm`}
                        icon="👥"
                        color="bg-orange-50"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Revenue Chart - 2/3 */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-5">Doanh thu theo tháng</h2>
                        {monthlyChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={55} />
                                    <Tooltip formatter={(v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)} />
                                    <Area type="monotone" dataKey="Doanh thu" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Orders by Status Pie - 1/3 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-5">Đơn theo trạng thái</h2>
                        {pieData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                            dataKey="value" paddingAngle={3}>
                                            {pieData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v + ' đơn', n]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 mt-3">
                                    {pieData.map((d) => (
                                        <div key={d.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                                <span className="text-gray-600">{d.name}</span>
                                            </div>
                                            <span className="font-medium text-gray-800">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar chart - orders per month */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-5">Số đơn hàng theo tháng</h2>
                        {monthlyChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="Đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Bar chart - new users per month */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-5">Người dùng mới theo tháng</h2>
                        {monthlyChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="Người dùng mới" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SellerDashboard;
