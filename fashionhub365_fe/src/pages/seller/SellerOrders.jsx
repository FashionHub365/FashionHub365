import React, { useState, useEffect } from 'react';
import OrderStats from './components/OrderStats';
import OrderFilters from './components/OrderFilters';
import OrderList from './components/OrderList';
import { fetchSellerOrders } from '../../services/orderService';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchSellerOrders();
            setOrders(data);
            setFilteredOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        if (filter === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status === filter));
        }
    };

    const handleOrderUpdate = () => {
        loadOrders();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Theo dõi và quản lý tất cả đơn hàng của bạn
                    </p>
                </div>

                {/* Stats */}
                <OrderStats orders={orders} />

                {/* Filters */}
                <OrderFilters
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    orders={orders}
                />

                {/* Orders List */}
                <OrderList
                    orders={filteredOrders}
                    onOrderUpdate={handleOrderUpdate}
                />
            </div>
        </div>
    );
};

export default SellerOrders;