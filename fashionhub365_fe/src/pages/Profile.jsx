import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import checkoutApi from '../apis/checkoutApi';
import wishlistApi from '../apis/wishlistApi';
import { Trash } from '../components/Icons';

// ── Status config ────────────────────────────────────────────────────────
// Backend status: created | confirmed | shipped | delivered | cancelled | refunded
const STATUS_MAP = {
    created: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400', icon: '⏳' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-400', icon: '✅' },
    shipped: { label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-400', icon: '🚚' },
    delivered: { label: 'Giao thành công', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500', icon: '🎉' },
    cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-400', icon: '❌' },
    refunded: { label: 'Hoàn tiền', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', icon: '💸' },
};

const PAY_MAP = {
    unpaid: { label: 'Chưa thanh toán', color: 'text-orange-600' },
    paid: { label: 'Đã thanh toán', color: 'text-green-600' },
    failed: { label: 'Lỗi thanh toán', color: 'text-red-600' },
    refunded: { label: 'Đã hoàn tiền', color: 'text-gray-500' },
};

// ── StatusBadge ─────────────────────────────────────────────────────
// Thanh trạng thái tiến trình đơn hàng
const STEPS = ['created', 'confirmed', 'shipped', 'delivered'];
const StatusProgress = ({ status }) => {
    if (status === 'cancelled' || status === 'refunded') return null;
    const currentIdx = STEPS.indexOf(status);
    return (
        <div className="flex items-center gap-0 mt-4 mb-2">
            {STEPS.map((step, i) => {
                const s = STATUS_MAP[step];
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                                ${done ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-300'}
                                ${active ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}>
                                {done ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : i + 1}
                            </div>
                            <span className={`text-[10px] whitespace-nowrap font-medium ${done ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-0.5 mb-3.5 transition-all ${i < currentIdx ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ── OrderCard ─────────────────────────────────────────────────────────
const OrderCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const st = STATUS_MAP[order.status] || STATUS_MAP.created;
    const pay = PAY_MAP[order.payment_status] || PAY_MAP.unpaid;
    const createdAt = new Date(order.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const addr = order.shipping_address;

    return (
        <div className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 bg-gray-50/60 border-b border-gray-100">
                <div>
                    <p className="text-xs text-gray-400 font-mono">#{order.uuid?.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{order.store_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{createdAt}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${order.status === 'created' ? 'animate-pulse' : ''}`} />
                        {st.icon} {st.label}
                    </span>
                    <span className={`text-xs font-medium ${pay.color}`}>{pay.label}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-6">
                <StatusProgress status={order.status} />
            </div>

            {/* Items preview (collapsed: first 2) */}
            <div className="px-6 py-4">
                <div className="flex flex-col gap-3">
                    {(expanded ? order.items : order.items.slice(0, 2)).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <img
                                src={item.snapshot?.image || '/textures/cartpage/image.jpg'}
                                alt={item.snapshot?.name}
                                className="w-14 h-18 object-cover rounded-lg flex-shrink-0"
                                style={{ height: '72px' }}
                                onError={e => { e.target.src = '/textures/cartpage/image.jpg'; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.snapshot?.name || 'Sản phẩm'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.snapshot?.variantName || ''}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">x{item.qty}</span>
                                    <span className="text-sm font-bold text-gray-900">{(item.price * item.qty).toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {order.items.length > 2 && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                        {expanded ? 'Thu gọn' : `+ ${order.items.length - 2} sản phẩm khác`}
                        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <div>
                    {addr && (
                        <p className="text-xs text-gray-500 truncate max-w-[220px]">
                            📍 {addr.address_line}, {addr.ward}, {addr.district}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Tổng thanh toán</p>
                    <p className="text-lg font-extrabold text-gray-900">{order.total_amount.toLocaleString('vi-VN')}₫</p>
                </div>
            </div>
        </div>
    );
};

// ── OrdersTab ───────────────────────────────────────────────────────────
const OrdersTab = ({ orders, loading, error, onShop }) => {
    const [filterStatus, setFilterStatus] = useState('all');

    const statusFilters = [
        { key: 'all', label: 'Tất cả' },
        { key: 'created', label: 'Chờ duyệt' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'shipped', label: 'Đang giao' },
        { key: 'delivered', label: 'Hoàn thành' },
        { key: 'cancelled', label: 'Đã huỷ' },
    ];

    const filtered = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-400 text-sm">Đang tải đơn hàng...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="py-16 text-center">
            <p className="text-red-500 font-medium">{error}</p>
        </div>
    );

    return (
        <div className="animate-fadeIn">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {statusFilters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                            ${filterStatus === f.key
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                    >
                        {f.label}
                        {f.key !== 'all' && (
                            <span className="ml-1 opacity-70">
                                ({orders.filter(o => o.status === f.key).length})
                            </span>
                        )}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-400">{filtered.length} đơn hàng</span>
            </div>

            {/* Order list */}
            {filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                        {filterStatus === 'all' ? 'Bạn chưa có đơn hàng nào' : `Không có đơn "${statusFilters.find(f => f.key === filterStatus)?.label}"`}
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 mb-6">Hãy mua sắm và quay lại đây để xem lịch sử đơn hàng!</p>
                    <button
                        onClick={onShop}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                    >
                        Mua sắm ngay
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {filtered.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Profile Page ─────────────────────────────────────────────────────────
export const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'orders');

    // Khi navigate đến /profile với state khác trong khi đang ở profile
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    // ── Orders state ──────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 6;

    useEffect(() => {
        if (activeTab === 'orders') {
            setOrdersLoading(true);
            setOrdersError('');
            checkoutApi.getMyOrders()
                .then(res => { if (res.success) setOrders(res.data); })
                .catch(() => setOrdersError('Không thể tải đơn hàng. Vui lòng thử lại.'))
                .finally(() => setOrdersLoading(false));
        }
        if (activeTab === 'wishlist' && user) {
            fetchWishlist(currentPage);
        }
    }, [activeTab, user, currentPage]);

    const fetchWishlist = async (page) => {
        setLoadingWishlist(true);
        try {
            const response = await wishlistApi.getWishlist(page, itemsPerPage);
            if (response.success) {
                setWishlist(response.data.items || []);
                setTotalPages(response.data.pagination.totalPages);
                setTotalItems(response.data.pagination.totalItems);
            }
        } catch (err) {
            console.error("Error fetching wishlist:", err);
        } finally {
            setLoadingWishlist(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await wishlistApi.removeFromWishlist(productId);
            setWishlist(prev => prev.filter(item => (item.productId._id || item.productId) !== productId));
            fetchWishlist(currentPage);
        } catch (err) {
            console.error("Error removing from wishlist:", err);
        }
    };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const tabs = [
        {
            id: 'profile', label: 'Overview', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            id: 'orders', label: 'Orders', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            id: 'wishlist', label: 'Wishlist', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        },
        {
            id: 'settings', label: 'Settings', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
            {/* Top Header Background with Parallax effect */}
            <div className="h-64 bg-gray-900 w-full absolute top-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center transform scale-110 blur-sm brightness-50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-gray-900/90 mix-blend-multiply"></div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto z-10 px-4 sm:px-6 lg:px-8 pt-32 pb-12">

                {/* Header Info Card */}
                <div className="relative mb-8 flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-400 via-pink-500 to-purple-500 shadow-2xl">
                            <img
                                className="w-full h-full rounded-full object-cover border-4 border-gray-900/50 backdrop-blur-sm"
                                src={`https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff&size=256`}
                                alt={user.username}
                            />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-gray-900 shadow-lg"></div>
                    </div>

                    <div className="text-center sm:text-left text-white pb-2 flex-1">
                        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">{user.username}</h1>
                        <p className="text-indigo-200 font-medium text-lg mt-1 flex items-center justify-center sm:justify-start">
                            <span className="bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm mr-2 border border-white/20">
                                {user.role || 'Fashion Member'}
                            </span>
                            <span className="text-sm opacity-80">{user.email}</span>
                        </p>
                    </div>

                    <div className="pb-2">
                        <button
                            onClick={handleLogout}
                            className="bg-white/10 hover:bg-white/20 hover:text-red-300 text-white backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg group"
                        >
                            <span>Sign Out</span>
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-gray-100">

                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-72 bg-gray-50/50 backdrop-blur-xl border-r border-gray-100 flex flex-col p-4">
                        <div className="hidden lg:block mb-8 px-4 pt-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu</h3>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group
                                        ${activeTab === tab.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-1 ring-indigo-500'
                                            : 'text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md'
                                        }`}
                                >
                                    <span className={`mr-3 p-1 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 group-hover:bg-indigo-50 text-gray-500 group-hover:text-indigo-600'}`}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                    {activeTab === tab.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-sm">Pro Tip</h4>
                                    <p className="text-xs text-indigo-700">Complete your profile to get 10% off!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar bg-white">

                        {/* Title Bar */}
                        <div className="mb-8 flex justify-between items-center border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <div className="text-sm text-gray-500">
                                Last login: {new Date().toLocaleDateString()}
                            </div>
                        </div>

                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-fadeIn">
                                {/* Stats Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                    {[
                                        { label: 'Total Orders', value: '0', icon: '🛍️', color: 'bg-blue-50 text-blue-600' },
                                        { label: 'Wishlist Items', value: totalItems.toString(), icon: '💖', color: 'bg-pink-50 text-pink-600' },
                                        { label: 'Reward Points', value: '100', icon: '⭐', color: 'bg-yellow-50 text-yellow-600' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                                                {stat.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500 opacity-5 rounded-full blur-2xl"></div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                                        Personal Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                        <div className="group">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 group-focus-within:text-indigo-500 transition-colors">Full Name</label>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 group-hover:border-indigo-300 transition-colors shadow-sm">
                                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                <span className="font-medium text-gray-800">{user.profile?.full_name || 'Not provided'}</span>
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 group-focus-within:text-indigo-500 transition-colors">Email Address</label>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 group-hover:border-indigo-300 transition-colors shadow-sm">
                                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <span className="font-medium text-gray-800">{user.email}</span>
                                                {user.is_email_verified && <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 group-focus-within:text-indigo-500 transition-colors">Information Status</label>
                                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 text-yellow-800 text-sm font-medium flex items-center">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-pulse"></span>
                                                Some details pending update
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-indigo-500/30">
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <OrdersTab
                                orders={orders}
                                loading={ordersLoading}
                                error={ordersError}
                                onShop={() => navigate('/listing')}
                            />
                        )}

                        {activeTab === 'wishlist' && (
                            <div className="animate-fadeIn">
                                {loadingWishlist ? (
                                    <div className="flex justify-center items-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                                    </div>
                                ) : wishlist.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {wishlist.map((item) => {
                                                const p = item.productId;
                                                if (!p) return null;
                                                return (
                                                    <div key={p._id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                                        <div className="relative aspect-[3/4] overflow-hidden">
                                                            <img
                                                                src={p.media?.[0]?.url || 'https://via.placeholder.com/300x400'}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveFromWishlist(p._id)}
                                                                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                                title="Remove from wishlist"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.name}</h4>
                                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>
                                                            <div className="mt-4 flex items-center justify-between">
                                                                <span className="text-lg font-bold text-gray-900">{p.base_price?.toLocaleString('vi-VN')}₫</span>
                                                                <button
                                                                    onClick={() => navigate(`/product/${p._id}`)}
                                                                    className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
                                                                >
                                                                    View Product
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="mt-12 flex justify-center items-center space-x-2">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors font-medium text-sm"
                                                >
                                                    Previous
                                                </button>
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === i + 1
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors font-medium text-sm"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="relative mx-auto w-32 h-32 mb-6 group cursor-pointer">
                                            <div className="absolute inset-0 bg-pink-50 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
                                            <div className="relative flex items-center justify-center h-full w-full">
                                                <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Your Wishlist is Empty</h3>
                                        <p className="text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">Keep track of your favorite items here. If you see something you like, tap the heart!</p>
                                        <button
                                            onClick={() => navigate('/listing')}
                                            className="mt-8 px-8 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300"
                                        >
                                            Explore Trends
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-fadeIn max-w-2xl">
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50">
                                    <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center text-indigo-900">
                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Security Settings
                                    </h4>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                            <input disabled type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                            <input disabled type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="pt-4">
                                            <button disabled className="w-full px-6 py-3 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed">
                                                Update Credentials (Coming Soon)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start space-x-4">
                                    <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-800">Delete Account</h4>
                                        <p className="text-sm text-red-600 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                                        <button disabled className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800 underline">Deactivate Account</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </div>
    );
};
