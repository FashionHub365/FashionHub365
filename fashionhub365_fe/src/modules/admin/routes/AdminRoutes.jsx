import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getUserRoleSlugs } from "../../../utils/roleUtils";
import AdminShell from "../components/AdminShell";

// Lazy load components
const AdminCategories = lazy(() => import("../../../pages/admin/AdminCategories"));
const AdminAuditLogsPage = lazy(() => import("../pages/AdminAuditLogsPage"));
const AdminContentPage = lazy(() => import("../pages/AdminContentPage"));
const AdminOverviewPage = lazy(() => import("../pages/AdminOverviewPage"));
const AdminOrdersPage = lazy(() => import("../pages/AdminOrdersPage"));
const AdminPermissionsPage = lazy(() => import("../pages/AdminPermissionsPage"));
const AdminProductsPage = lazy(() => import("../pages/AdminProductsPage"));
const AdminReportsPage = lazy(() => import("../pages/AdminReportsPage"));
const AdminRolesPage = lazy(() => import("../pages/AdminRolesPage"));
const AdminSupportPage = lazy(() => import("../pages/AdminSupportPage"));
const AdminSystemPage = lazy(() => import("../pages/AdminSystemPage"));
const AdminUserPermissionsPage = lazy(() => import("../pages/AdminUserPermissionsPage"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage"));
const AdminUserGroupsPage = lazy(() => import("../pages/AdminUserGroupsPage"));
const AdminSellerRequestsPage = lazy(() => import("../pages/AdminSellerRequestsPage"));
const AdminVouchersPage = lazy(() => import("../pages/AdminVouchersPage"));
const AdminCampaignsPage = lazy(() => import("../pages/AdminCampaignsPage"));
const AdminFlashSalesPage = lazy(() => import("../pages/AdminFlashSalesPage"));
const AdminMetadataPage = lazy(() => import("../pages/AdminMetadataPage"));
const ComingSoon = lazy(() => import("../pages/ComingSoon"));

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const getRawRoles = (user) => {
  const roles = new Set();
  const directRole = normalizeRole(user?.role);
  if (directRole) roles.add(directRole);

  const globalRoles = Array.isArray(user?.global_role_ids) ? user.global_role_ids : [];
  globalRoles.forEach((role) => {
    if (typeof role === "string") {
      const slug = normalizeRole(role);
      if (slug && slug.length !== 24) roles.add(slug);
      return;
    }
    if (role && typeof role === "object") {
      const slug = normalizeRole(role.slug || role.name);
      if (slug) roles.add(slug);
    }
  });

  return Array.from(roles);
};

// Loading component for Suspense
const AdminPageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-4">
      <div className="w-6 h-6 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
    </div>
    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Page...</p>
  </div>
);

const AdminRoutes = () => {
  const { user } = useAuth();
  const rawRoles = getRawRoles(user);
  const effectiveRoles = getUserRoleSlugs(user);
  const hasRestrictedRole = ["staff", "operator", "finance", "cs"].some((role) =>
    rawRoles.includes(role)
  );
  const canAccessAdmin =
    rawRoles.includes("super-admin") ||
    rawRoles.includes("admin") ||
    (effectiveRoles.includes("admin") && !hasRestrictedRole);

  if (!canAccessAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <Suspense fallback={<AdminPageLoader />}>
      <Routes>
        <Route element={<AdminShell />}>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="user-permissions" element={<AdminUserPermissionsPage />} />
          <Route path="user-groups" element={<AdminUserGroupsPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="permissions" element={<AdminPermissionsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="seller-requests" element={<AdminSellerRequestsPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="flash-sales" element={<AdminFlashSalesPage />} />
          <Route path="metadata" element={<AdminMetadataPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />
          <Route path="support" element={<AdminSupportPage />} />

          {/* Missing sidebar routes registered with ComingSoon placeholder */}
          <Route path="shipping" element={<ComingSoon title="Shipping Management" />} />
          <Route path="payments" element={<ComingSoon title="Payments & Transactions" />} />
          <Route path="withdrawals" element={<ComingSoon title="Withdrawal Requests" />} />
          <Route path="coupons" element={<ComingSoon title="Legacy Coupons" />} />
          <Route path="banners" element={<ComingSoon title="Banners & Ads" />} />
          <Route path="pages" element={<ComingSoon title="Static Pages" />} />
          <Route path="blog" element={<ComingSoon title="Blog & News" />} />
          <Route path="appearance" element={<ComingSoon title="Appearance Settings" />} />
          <Route path="catalog/reports" element={<ComingSoon title="Catalog Reports" />} />

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
