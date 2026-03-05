import React, { useState, useEffect } from 'react';
import { fetchSellerOrders } from '../../../services/orderService';
import OrderStats from './components/OrderStats';
import OrderFilters from './components/OrderFilters';
import OrderList from './components/OrderList';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchSellerOrders();
            setOrders(data);
            setFilteredOrders(data);
        } catch (err) {
            console.error('Error loading orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setFilteredOrders(filter === 'all' ? orders : orders.filter(o => o.status === filter));
    };

    const handleOrderUpdate = () => loadOrders();

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="relative w-11 h-11">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="animate-fadeIn" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Seller Portal</p>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Theo dõi và xử lý tất cả đơn hàng của bạn</p>
                    </div>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                        ↻ Làm mới
                    </button>
                </div>

                {/* Stats */}
                <OrderStats orders={orders} />

                {/* Filters */}
                <OrderFilters
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    orders={orders}
                />

                {/* List */}
                <OrderList orders={filteredOrders} onOrderUpdate={handleOrderUpdate} />
            </div>
        </div>
    );
};

export default SellerOrders;
