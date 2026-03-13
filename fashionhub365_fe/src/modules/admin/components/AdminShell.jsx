import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const menuItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    id: "users_group",
    label: "User Management",
    icon: "users",
    children: [
      { to: "/admin/users", label: "Users" },
      { to: "/admin/user-permissions", label: "User Permissions" },
      { to: "/admin/roles", label: "Roles" },
      { to: "/admin/user-groups", label: "Role Groups" },
      { to: "/admin/seller-requests", label: "Seller Requests" }
    ]
  },
  { to: "/admin/categories", label: "Categories", icon: "content" },
  { to: "/admin/products", label: "Products", icon: "content" },
  { to: "/admin/orders", label: "Orders", icon: "reports" },
  { to: "/admin/content", label: "Content", icon: "content" },
  { to: "/admin/reports", label: "Reports", icon: "reports" },
  { to: "/admin/audit", label: "Audit Logs", icon: "security" },
  { to: "/admin/support", label: "Support", icon: "content" },
];

const configItems = [
  { to: "/admin/system", label: "Settings", icon: "settings" },
  { to: "/admin/permissions", label: "Permissions", icon: "security" },
];

const renderIcon = (name, isActive) => {
  const baseClass = `w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`;
  switch (name) {
    case 'dashboard': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
    case 'users': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
    case 'content': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
    case 'reports': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
    case 'settings': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
    case 'security': return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
    default: return null;
  }
};

const navClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
    ? "bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100"
    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
  }`;

const AdminShell = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-5 border-b border-slate-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">AdminPro</h1>
                <p className="text-[10px] text-slate-500 font-medium">Management System</p>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto flex-1 mt-2">
            {menuItems.map((item) => {
              if (item.children) {
                const isOpen = openMenus[item.id];
                // Check if any child is active
                const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.to));

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${hasActiveChild
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {renderIcon(item.icon, hasActiveChild)}
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="ml-9 space-y-1 border-l-2 border-indigo-100 pl-3">
                        {item.children.map(child => {
                          const isChildActive = location.pathname.startsWith(child.to);
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isChildActive
                                ? "text-indigo-600 bg-indigo-50/50"
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
                <NavLink key={item.to} to={item.to} className={`w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}>
                  {renderIcon(item.icon, isActive)}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="mt-6 mb-2">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">CONFIGURATION</p>
            </div>
            {configItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink key={item.to} to={item.to} className={`w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}>
                  {renderIcon(item.icon, isActive)}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-slate-100/50">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex items-center justify-center shrink-0">
                {adminInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900 font-semibold truncate leading-tight">{adminName}</p>
                <p className="text-[11px] text-slate-500 font-medium">Super Admin</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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

      <div className="lg:ml-64 min-h-screen flex flex-col">
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

              <div className="relative flex-1 max-w-md hidden sm:block">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  placeholder="Search for analytics, users, or reports..."
                  className="w-full bg-slate-100/70 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all"
                />
              </div>
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
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                      My Profile
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                      Account Settings
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-colors">
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

