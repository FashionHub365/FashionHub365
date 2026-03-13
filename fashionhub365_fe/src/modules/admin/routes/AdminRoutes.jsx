import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getUserRoleSlugs } from "../../../utils/roleUtils";
import AdminCategories from "../../../pages/admin/AdminCategories";
import AdminShell from "../components/AdminShell";
import AdminAuditLogsPage from "../pages/AdminAuditLogsPage";
import AdminContentPage from "../pages/AdminContentPage";
import AdminOverviewPage from "../pages/AdminOverviewPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminPermissionsPage from "../pages/AdminPermissionsPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import AdminReportsPage from "../pages/AdminReportsPage";
import AdminRolesPage from "../pages/AdminRolesPage";
import AdminSupportPage from "../pages/AdminSupportPage";
import AdminSystemPage from "../pages/AdminSystemPage";
import AdminUserPermissionsPage from "../pages/AdminUserPermissionsPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminUserGroupsPage from "../pages/AdminUserGroupsPage";
import AdminSellerRequestsPage from "../pages/AdminSellerRequestsPage";

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
    <Routes>
      <Route element={<AdminShell />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
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
        <Route path="system" element={<AdminSystemPage />} />
        <Route path="audit" element={<AdminAuditLogsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
