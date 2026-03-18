import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const menuItems = [
  { to: "/admin/dashboard", label: "Tổng quan", icon: "dashboard" },
  {
    id: "users_group",
    label: "Người dùng & Quyền",
    icon: "users",
    children: [
      { to: "/admin/users", label: "Danh sách người dùng" },
      { to: "/admin/roles", label: "Vai trò & Quyền" },
      { to: "/admin/user-groups", label: "Nhóm người dùng" },
      { to: "/admin/seller-requests", label: "Yêu cầu người bán" }
    ]
  },
  {
    id: "products_group",
    label: "Sản phẩm & Danh mục",
    icon: "products",
    children: [
      { to: "/admin/products", label: "Tất cả sản phẩm" },
      { to: "/admin/categories", label: "Danh mục" },
      { to: "/admin/metadata", label: "Metadata (Brands, Tags...)" },
      { to: "/admin/catalog/reports", label: "Báo cáo & Giám sát" }
    ]
  },
  {
    id: "orders_group",
    label: "Đơn hàng & Vận chuyển",
    icon: "orders",
    children: [
      { to: "/admin/orders", label: "Danh sách đơn hàng" },
      { to: "/admin/shipping", label: "Vận chuyển" }
    ]
  },
  {
    id: "finance_group",
    label: "Thanh toán & Tài chính",
    icon: "finance",
    children: [
      { to: "/admin/payments", label: "Giao dịch" },
      { to: "/admin/withdrawals", label: "Yêu cầu rút tiền" }
    ]
  },
  {
    id: "analytics_group",
    label: "Analytics & Thống kê",
    icon: "analytics",
    children: [
      { to: "/admin/reports", label: "Báo cáo doanh thu" },
      { to: "/admin/audit", label: "Nhật ký hệ thống" }
    ]
  },
  {
    id: "marketing_group",
    label: "Marketing & Khuyến mãi",
    icon: "marketing",
    children: [
      { to: "/admin/vouchers", label: "Mã giảm giá (Vouchers)" },
      { to: "/admin/campaigns", label: "Chiến dịch (Campaigns)" },
      { to: "/admin/flash-sales", label: "Flash Sales" },
      { to: "/admin/coupons", label: "Mã giảm giá cũ" },
      { to: "/admin/banners", label: "Banner & Quảng cáo" }
    ]
  },
  {
    id: "content_group",
    label: "Nội dung & Giao diện",
    icon: "content",
    children: [
      { to: "/admin/pages", label: "Trang tĩnh" },
      { to: "/admin/blog", label: "Tin tức" },
      { to: "/admin/appearance", label: "Giao diện" }
    ]
  },
  { to: "/admin/system", label: "Cài đặt hệ thống", icon: "settings" },
];

const renderIcon = (name, isActive) => {
  const baseClass = `w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`;
  switch (name) {
    case 'dashboard': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
    case 'users': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
    case 'products': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
    case 'orders': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
    case 'finance': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    case 'analytics': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
    case 'marketing': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    );
    case 'content': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
    case 'settings': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
    default: return null;
  }
};

const AdminShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState({ users_group: true });

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    setSidebarOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const adminName = useMemo(() => {
    const profileName = user?.profile?.full_name;
    return profileName || user?.username || user?.email || "Admin";
  }, [user]);

  const adminInitial = useMemo(() => `${adminName}`.trim().charAt(0).toUpperCase() || "A", [adminName]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 lg:translate-x-0 ${!isHovered ? "w-20" : "w-64"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-full flex flex-col relative">
          <div className={`px-5 py-6 flex flex-col items-center transition-all duration-300 ${!isHovered ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
            <div className="flex items-center justify-center mb-1">
              <span className="text-xl font-black tracking-tight text-indigo-600">FashionHub<span className="text-slate-900">365</span></span>
            </div>
            <div className="h-0.5 w-12 bg-indigo-600/20 rounded-full" />
          </div>

          {/* Logo Placeholder when collapsed */}
          {!isHovered && (
            <div className="px-5 py-6 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">F</div>
            </div>
          )}

          <nav className="p-3 space-y-1 overflow-y-auto flex-1 mt-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
            {menuItems.map((item) => {
              if (item.children) {
                const isOpen = openMenus[item.id];
                // Check if any child is active
                const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.to));

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => isHovered && toggleMenu(item.id)}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${hasActiveChild
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-500 hover:bg-slate-50"
                        } ${!isHovered ? 'justify-center' : ''}`}
                      title={!isHovered ? item.label : ""}
                    >
                      {hasActiveChild && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                      )}
                      <div className={`flex items-center ${!isHovered ? 'justify-center' : 'gap-3'}`}>
                        {renderIcon(item.icon, hasActiveChild)}
                        {isHovered && <span>{item.label}</span>}
                      </div>
                      {isHovered && (
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {isOpen && isHovered && (
                      <div className="mt-1 space-y-1">
                        {item.children.map(child => {
                          const isChildActive = location.pathname.startsWith(child.to);
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              className={`block px-11 py-2 text-[13px] font-medium transition-colors text-left ${isChildActive
                                ? "text-indigo-600 font-semibold"
                                : "text-slate-500 hover:text-indigo-600"
                                }`}
                            >
                              {child.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                    } ${!isHovered ? 'justify-center' : 'gap-3'}`}
                  title={!isHovered ? item.label : ""}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                  )}
                  {renderIcon(item.icon, isActive)}
                  {isHovered && <span>{item.label}</span>}
                </NavLink>
              );
            })}

            {/* Remove Configuration Header and separate nav items */}
          </nav>

          <div className="mt-auto border-t border-slate-100/50">
            <div className={`p-4 ${!isHovered ? 'space-y-4' : 'space-y-3'}`}>
              <div className={`flex items-center px-1 ${!isHovered ? 'justify-center' : 'gap-3'}`}>
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-indigo-50">
                  AD
                </div>
                {isHovered && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm text-slate-900 font-bold truncate leading-tight">Admin</p>
                    <p className="text-[11px] text-slate-500 font-medium">Administrator</p>
                  </div>
                )}
              </div>

              <button
                className={`w-full flex items-center py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all group ${!isHovered ? 'justify-center px-0' : 'px-3 gap-3'}`}
                title={!isHovered ? "Đăng xuất" : ""}
              >
                <svg className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isHovered && <span>Đăng xuất</span>}
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

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${!isHovered ? "lg:ml-20" : "lg:ml-64"}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const query = e.target.search.value;
                  if (query) navigate(`/admin/products?search=${encodeURIComponent(query)}`);
                }}
                className="relative flex-1 max-w-md hidden sm:block"
              >
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  name="search"
                  placeholder="Tìm kiếm sản phẩm, người dùng hoặc báo cáo..."
                  className="w-full bg-slate-100/70 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all"
                />
              </form>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>

              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              </button>

              <div className="relative ml-2">
                <button
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-200">
                    {adminInitial}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5">
                    <button
                      onClick={() => { setAccountOpen(false); navigate('/profile'); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => { setAccountOpen(false); navigate('/admin/system'); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Account Settings
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
