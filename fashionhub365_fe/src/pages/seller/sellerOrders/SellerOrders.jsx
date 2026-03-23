import React, { useState, useEffect } from 'react';
import { fetchSellerOrders, updateOrderStatus } from '../../../services/orderService';
import { showSuccess, showError } from '../../../utils/swalUtils';
import OrderStats from './components/OrderStats';
import OrderFilters from './components/OrderFilters';
import OrderList from './components/OrderList';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [error, setError] = useState('');

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchSellerOrders();
            setOrders(data);
            setFilteredOrders(data);
            setError('');
        } catch (err) {
            console.error('Error loading orders:', err);
            setError(err.response?.data?.message || 'Could not load seller orders.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setFilteredOrders(filter === 'all' ? orders : orders.filter(o => o.status === filter));
    };

    const handleOrderUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            showSuccess('Đã cập nhật trạng thái đơn hàng thành công!');
            loadOrders();
        } catch (err) {
            console.error('Error updating order:', err);
            showError('Lỗi khi cập nhật đơn hàng: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="relative w-11 h-11">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center py-24">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-sm">
                <p className="text-red-600 font-semibold text-sm">{error}</p>
                <p className="text-xs text-red-400 mt-1">Please check your seller account permissions and store access.</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Track and process all your orders</p>
                    </div>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                        ↻ Refresh
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
