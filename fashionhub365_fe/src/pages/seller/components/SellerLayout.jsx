import React, { useEffect, useState, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../../../contexts/ChatContext';
import storeApi from '../../../apis/store.api';

const menuItems = [
    { to: '/seller/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/seller/orders', label: 'Orders', icon: 'orders' },
    { to: '/seller/products', label: 'Products', icon: 'products' },
    { to: '/seller/inventory', label: 'Inventory', icon: 'inventory' },
    { to: '/seller/wallet', label: 'Wallet', icon: 'wallet' },
    { to: '/seller/vouchers', label: 'Vouchers', icon: 'voucher' },
    { to: '/seller/chat', label: 'Chat', icon: 'chat' },
    { to: '/seller/settings', label: 'Store Settings', icon: 'settings' },
];

const routeMeta = {
    '/seller/dashboard': {
        eyebrow: 'Seller Workspace',
        title: 'Dashboard',
        description: 'Monitor revenue, orders and store activity in one place.'
    },
    '/seller/orders': {
        eyebrow: 'Seller Workspace',
        title: 'Order Operations',
        description: 'Review, filter and update order progress for your store.'
    },
    '/seller/products': {
        eyebrow: 'Seller Workspace',
        title: 'Product Catalog',
        description: 'Keep your product list, categories and status organized.'
    },
    '/seller/inventory': {
        eyebrow: 'Seller Workspace',
        title: 'Inventory Control',
        description: 'Manage stock visibility and availability across products.'
    },
    '/seller/wallet': {
        eyebrow: 'Seller Workspace',
        title: 'Wallet',
        description: 'Check balances, payment activity and withdrawal status.'
    },
    '/seller/vouchers': {
        eyebrow: 'Seller Workspace',
        title: 'Voucher Center',
        description: 'Create and monitor seller-facing promotional offers.'
    },
    '/seller/chat': {
        eyebrow: 'Seller Workspace',
        title: 'Customer Chat',
        description: 'Stay on top of messages and support requests from buyers.'
    },
    '/seller/profile': {
        eyebrow: 'Seller Workspace',
        title: 'My Profile',
        description: 'Update your personal information and profile picture.'
    },
    '/seller/settings': {
        eyebrow: 'Seller Workspace',
        title: 'Store Settings',
        description: 'Manage your store branding, contact info and public profile.'
    },
};

const renderIcon = (name, isActive) => {
    const baseClass = `w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`;

    switch (name) {
        case 'dashboard':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            );
        case 'orders':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            );
        case 'products':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            );
        case 'inventory':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V7a2 2 0 00-2-2h-3.17a2 2 0 01-1.42-.59l-.82-.82A2 2 0 0011.17 3H6a2 2 0 00-2 2v2m16 6l-2.586 2.586a2 2 0 01-1.414.586H6a2 2 0 01-2-2v-1m16 0V9a2 2 0 00-2-2M4 13v6a2 2 0 002 2h10" />
                </svg>
            );
        case 'wallet':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-6h4m0 0v6m0-6l-3-3m3 3l-3 3" />
                </svg>
            );
        case 'voucher':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 9V5a3 3 0 00-6 0v4M5 9h14l1 10a2 2 0 01-2 2H6a2 2 0 01-2-2L5 9zm4 4h.01M15 13h.01" />
                </svg>
            );
        case 'chat':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 11.5c0 4.142-4.03 7.5-9 7.5a10.74 10.74 0 01-4.228-.833L3 19l1.135-3.405C3.419 14.42 3 13.001 3 11.5 3 7.358 7.03 4 12 4s9 3.358 9 7.5z" />
                </svg>
            );
        case 'settings':
            return (
                <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
        default:
            return null;
    }
};

const getPageMeta = (pathname) => routeMeta[pathname] || routeMeta['/seller/dashboard'];

const SellerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { sessions } = useChat();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [storeRef, setStoreRef] = useState('');

    const unreadCount = sessions
        .filter((session) => typeof session.user_id === 'object' && session.user_id !== null)
        .reduce((sum, session) => sum + (session.unreadCount || 0), 0);

    useEffect(() => {
        setSidebarOpen(false);
        setAccountOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        let ignore = false;

        const loadMyStore = async () => {
            try {
                const response = await storeApi.getMyStore();
                const store = response?.data?.store || response?.store || response?.data;
                const ref = store?.uuid || store?._id || '';
                if (!ignore) {
                    setStoreRef(ref);
                }
            } catch (error) {
                if (!ignore) {
                    setStoreRef('');
                }
            }
        };

        loadMyStore();

        return () => {
            ignore = true;
        };
    }, []);

    const sellerName = user?.profile?.full_name || user?.username || user?.email || 'Seller';
    const sellerInitial = `${sellerName}`.trim().charAt(0).toUpperCase() || 'S';
    const currentPage = getPageMeta(location.pathname);

    const openStorefront = () => {
        if (storeRef) {
            navigate(`/stores/${storeRef}`);
            return;
        }
        navigate('/stores');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 lg:translate-x-0 ${!isHovered ? 'w-20' : 'w-72'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col relative">
                    <div className={`px-6 py-6 transition-all duration-300 border-b border-slate-100 ${!isHovered ? 'opacity-0 h-0 p-0 overflow-hidden border-b-0' : 'opacity-100'}`}>
                        <div className="flex items-center justify-start mb-1">
                            <span className="text-xl font-black tracking-tight text-indigo-600">FashionHub<span className="text-slate-900">365</span></span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.24em]">Seller Center</p>
                        <div className="h-0.5 w-14 bg-indigo-600/20 rounded-full mt-3" />
                    </div>

                    {!isHovered && (
                        <div className="px-5 py-6 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">F</div>
                        </div>
                    )}

                    <nav className="p-3 space-y-1 overflow-y-auto flex-1 mt-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
                        {menuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.to);
                            const isChatItem = item.to === '/seller/chat';

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={`w-full group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 relative ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'} ${!isHovered ? 'justify-center' : 'gap-3'}`}
                                    title={!isHovered ? item.label : ''}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                                    )}
                                    <div className="relative">
                                        {renderIcon(item.icon, isActive)}
                                        {isChatItem && unreadCount > 0 && (
                                            <span className={`absolute -top-1 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white ${isHovered ? '-right-1' : '-right-2'}`}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {isHovered && (
                                        <span className="truncate text-[15px]">{item.label}</span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="mt-auto border-t border-slate-100/50">
                        <div className={`p-4 ${!isHovered ? 'space-y-4' : 'space-y-3'}`}>
                            <div className={`flex items-center rounded-2xl bg-slate-50 ${!isHovered ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-3'}`}>
                                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-indigo-50">
                                    {sellerInitial}
                                </div>
                                {isHovered && (
                                    <div className="min-w-0 flex-1 text-left">
                                        <p className="text-sm text-slate-900 font-bold truncate leading-tight">{sellerName}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Seller account</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/seller/profile')}
                                className={`w-full flex items-center py-2.5 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group ${!isHovered ? 'justify-center px-0' : 'px-3 gap-3'}`}
                                title={!isHovered ? 'Profile' : ''}
                            >
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A11.963 11.963 0 0112 15c2.5 0 4.823.765 6.879 2.072M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {isHovered && <span>My Profile</span>}
                            </button>

                            <button
                                onClick={() => {
                                    if (logout) logout();
                                    navigate('/');
                                }}
                                className={`w-full flex items-center py-2.5 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group ${!isHovered ? 'justify-center px-0' : 'px-3 gap-3'}`}
                                title={!isHovered ? 'Logout' : ''}
                            >
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {isHovered && <span>Logout</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {sidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                />
            )}

            <div className={`transition-all duration-300 min-h-screen flex flex-col ${!isHovered ? 'lg:ml-20' : 'lg:ml-72'}`}>
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                    <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                                onClick={() => setSidebarOpen((prev) => !prev)}
                                className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                                aria-label="Toggle sidebar"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">{currentPage.eyebrow}</p>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{currentPage.title}</h1>
                                <p className="hidden sm:block text-sm text-slate-500 truncate">{currentPage.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <button
                                onClick={() => navigate('/seller/chat')}
                                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                                aria-label="Open seller chat"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={openStorefront}
                                className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                View Storefront
                            </button>

                            <div className="relative ml-1">
                                <button
                                    onClick={() => setAccountOpen((prev) => !prev)}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-200">
                                        {sellerInitial}
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>

                                {accountOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setAccountOpen(false);
                                                navigate('/seller/profile');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            My Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAccountOpen(false);
                                                navigate('/seller/dashboard');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            Seller Dashboard
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAccountOpen(false);
                                                openStorefront();
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            View Storefront
                                        </button>
                                        <div className="my-1 border-t border-slate-100" />
                                        <button
                                            onClick={() => {
                                                if (logout) logout();
                                                setAccountOpen(false);
                                                navigate('/');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-4">
                                <div className="w-6 h-6 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center px-4">Loading Workspace...</p>
                        </div>
                    }>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;
