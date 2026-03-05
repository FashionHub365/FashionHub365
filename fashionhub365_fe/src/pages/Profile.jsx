import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-x-100">
                <div className="w-10 h-10 border-4 border-x-200 border-t-x-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs = [
        {
            id: 'profile', label: 'Tổng Quan', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            )
        },
        {
            id: 'orders', label: 'Đơn Hàng', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            )
        },
        {
            id: 'details', label: 'Hồ Sơ', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            )
        },
        {
            id: 'addresses', label: 'Sổ Địa Chỉ', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
            )
        },
        {
            id: 'vouchers', label: 'Voucher', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
            )
        },
        {
            id: 'notifications', label: 'Thông Báo', hasNotification: true, icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
            )
        },
        {
            id: 'reviews', label: 'Đánh Giá', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            )
        },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-x-100 font-sans text-x-600 pt-8 pb-12 overflow-x-hidden relative">
            <div className={`max-w-[1200px] w-full mx-auto px-4 lg:px-8 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

                {/* Breadcrumb replacement / Top Header */}
                <div className="mb-6 pt-2 text-sm text-x-400 font-medium">
                    <span className="cursor-pointer hover:text-x-600">Home</span> &gt; <span className="cursor-pointer hover:text-x-600">Account</span> &gt; <span className="text-x-600 font-semibold capitalize">{activeTab}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Sidebar Layout */}
                    <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
                        {/* User Profile Card */}
                        <div className="bg-white rounded-xl p-6 border border-x-200 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-x-600 text-white flex items-center justify-center text-3xl font-bold mb-4">
                                {user.profile?.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </div>
                            <p className="text-xs text-x-400 uppercase tracking-widest font-bold mb-1">XIN CHÀO,</p>
                            <h2 className="text-lg font-bold text-x-600 leading-tight mb-1">{user.profile?.full_name || user.username}</h2>
                            <p className="text-[13px] text-x-500 mb-3">{user.email}</p>
                            <span className="inline-block px-3 py-1 bg-x-100 border border-x-200 rounded-full text-xs font-bold text-x-600 uppercase shadow-sm">
                                {user.role || 'Member'}
                            </span>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="bg-white rounded-xl border border-x-200 shadow-sm overflow-hidden flex flex-col">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center justify-between px-6 py-4 text-sm font-semibold transition-all duration-200 border-l-4
                                        ${activeTab === tab.id
                                            ? 'bg-x-600 text-white border-white'
                                            : 'text-x-600 bg-transparent border-transparent hover:bg-x-100'}
                                    `}
                                >
                                    <div className="flex flex-1 items-center gap-4">
                                        <div className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                                            {React.cloneElement(tab.icon, { className: 'w-[18px] h-[18px]' })}
                                        </div>
                                        <span>{tab.label}</span>
                                    </div>
                                    {tab.hasNotification && (
                                        <div className="w-2 h-2 rounded-full bg-red flex-shrink-0"></div>
                                    )}
                                </button>
                            ))}

                            <div className="h-px bg-x-200 my-1 mx-4"></div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 px-6 py-4 text-sm font-semibold text-x-600 hover:bg-x-100 transition-colors border-l-4 border-transparent"
                            >
                                <svg className="w-[18px] h-[18px] text-x-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                <span>Đăng xuất</span>
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 w-full bg-white rounded-xl border border-x-200 shadow-sm p-8 min-h-[600px]">

                        {/* Profile Overview */}
                        {activeTab === 'profile' && (
                            <div className="animate-fade-in">
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-x-600 mb-2">Account Overview</h3>
                                    <p className="text-sm text-x-500">Manage your personal information and track your orders.</p>
                                </div>

                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="border border-x-200 p-5 rounded-lg flex items-center justify-between hover:border-x-400 transition-colors bg-x-100/50">
                                        <div>
                                            <p className="text-xs font-bold text-x-400 uppercase tracking-widest mb-1">Delivering</p>
                                            <p className="text-2xl font-bold text-x-600">2</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-x-200 flex items-center justify-center text-x-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="border border-x-200 p-5 rounded-lg flex items-center justify-between hover:border-x-400 transition-colors bg-x-100/50">
                                        <div>
                                            <p className="text-xs font-bold text-x-400 uppercase tracking-widest mb-1">Vouchers</p>
                                            <p className="text-2xl font-bold text-x-600">5</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-x-200 flex items-center justify-center text-x-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="border border-x-200 p-5 rounded-lg flex items-center justify-between hover:border-x-400 transition-colors bg-x-100/50">
                                        <div>
                                            <p className="text-xs font-bold text-x-400 uppercase tracking-widest mb-1">Points</p>
                                            <p className="text-2xl font-bold text-x-600">1,200</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-x-200 flex items-center justify-center text-x-600">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Orders List */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-x-600 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-x-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                            Recent Orders
                                        </h4>
                                        <button className="text-sm font-semibold text-x-500 hover:text-x-600 underline">View all &gt;</button>
                                    </div>

                                    <div className="border border-x-200 rounded-lg overflow-hidden">
                                        <div className="p-4 border-b border-x-200 hover:bg-x-100/30 transition-colors">
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 bg-x-200 rounded overflow-hidden flex-shrink-0">
                                                        <img src="/textures/landingpage/frame-4.jpg" alt="Item" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-x-600 mb-1">#FWN-10293</p>
                                                        <p className="text-xs text-x-500 mb-1">12/10/2023 • 14:30</p>
                                                        <p className="text-sm text-x-600">The Holiday Outfit Edit x1</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-2.5 py-1 bg-x-600 text-white text-xs font-bold rounded">Delivering</span>
                                                    <p className="text-sm font-bold text-x-600">$ 450.00</p>
                                                    <button className="text-xs font-semibold px-4 py-1.5 border border-x-600 text-x-600 rounded hover:bg-x-600 hover:text-white transition-colors">Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Personal Info */}
                                    <div className="border border-x-200 rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-x-600 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-x-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                                Personal Information
                                            </h4>
                                            <button className="text-xs font-semibold text-x-500 hover:text-x-600 border border-x-200 px-3 py-1 rounded">Edit</button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between border-b border-x-100 pb-2">
                                                <span className="text-sm text-x-500">Full Name</span>
                                                <span className="text-sm font-semibold text-x-600">{user.profile?.full_name || user.username}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-x-100 pb-2">
                                                <span className="text-sm text-x-500">Email</span>
                                                <span className="text-sm font-semibold text-x-600">{user.email}</span>
                                            </div>
                                            <div className="flex justify-between pb-1">
                                                <span className="text-sm text-x-500">Phone</span>
                                                <span className="text-sm font-semibold text-x-600">{user.profile?.phone || 'Not provided'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default Address */}
                                    <div className="border border-x-200 rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-x-600 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-x-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                                Default Address
                                            </h4>
                                            <button className="text-xs font-semibold text-x-500 hover:text-x-600 border border-x-200 px-3 py-1 rounded">Change</button>
                                        </div>
                                        <div className="flex gap-3 items-start bg-x-100/50 p-3 rounded">
                                            <svg className="w-5 h-5 text-x-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                                            <div>
                                                <p className="text-sm font-bold text-x-600 mb-0.5">Home</p>
                                                <p className="text-xs text-x-500 leading-relaxed">
                                                    123 Fashion Avenue, Suite 4B<br />
                                                    New York, NY 10001
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Tabs Placeholder */}
                        {activeTab !== 'profile' && (
                            <div className="h-full flex flex-col items-center justify-center min-h-[400px] animate-fade-in text-center">
                                <div className="w-16 h-16 bg-x-100 rounded-full flex items-center justify-center text-x-400 mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-x-600 mb-2 capitalize">{activeTab} Section</h3>
                                <p className="text-sm text-x-500 max-w-sm">This section is currently under construction. Check back soon for updates to your {activeTab}.</p>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};
