import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ADMIN_TIER_ROLE_SLUGS,
  extractRawRoleSlugs,
  getUserRoleSlugs
} from "../../../utils/roleUtils";
import { adminOverviewService } from "../services/adminOverviewService";

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const EMPTY_ROLE_FORM = {
  name: "",
  slug: "",
  description: "",
  scope: "GLOBAL",
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const getPermissionId = (permission) =>
  typeof permission === "string" ? permission : permission?._id;

const mapRoleToForm = (role) => ({
  name: role?.name || "",
  slug: role?.slug || "",
  description: role?.description || "",
  scope: role?.scope || "GLOBAL",
});

const extractRolePermissionIds = (role) => {
  if (!Array.isArray(role?.permission_ids)) return [];
  return role.permission_ids
    .map((permission) => getPermissionId(permission))
    .filter(Boolean);
};

const AdminRolesPage = () => {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentEffectiveRoles = useMemo(
    () => getUserRoleSlugs(currentUser),
    [currentUser]
  );

  const currentRawRoles = useMemo(
    () => extractRawRoleSlugs(currentUser),
    [currentUser]
  );

  const isSuperAdmin = currentRawRoles.includes("super-admin");
  const isAdmin = currentRawRoles.includes("admin");
  const canManageRoles = isSuperAdmin || isAdmin;

  const activeRoles = useMemo(
    () =>
      roles
        .filter((role) => !role.deleted_at)
        .filter((role) => {
          if (isSuperAdmin) return true;
          return !ADMIN_TIER_ROLE_SLUGS.has(normalizeRole(role.slug));
        }),
    [roles, isSuperAdmin]
  );

  const moduleNames = useMemo(
    () => Object.keys(groupedPermissions).sort((a, b) => a.localeCompare(b)),
    [groupedPermissions]
  );

  const totalPermissions = useMemo(
    () =>
      moduleNames.reduce(
        (acc, moduleName) =>
          acc +
          (Array.isArray(groupedPermissions[moduleName])
            ? groupedPermissions[moduleName].length
            : 0),
        0
      ),
    [moduleNames, groupedPermissions]
  );

  const activeRole = useMemo(
    () => roles.find((role) => role._id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const refreshRoles = useCallback(async (preferredRoleId = "") => {
    const roleList = await adminOverviewService.getRoles({
      page: 1,
      limit: 200,
      includeDeleted: false,
      sortBy: "name",
      order: "asc",
    });

    setRoles(roleList);

    const manageableRoles = roleList
      .filter((role) => !role.deleted_at)
      .filter((role) => {
        if (isSuperAdmin) return true;
        return !ADMIN_TIER_ROLE_SLUGS.has(normalizeRole(role.slug));
      });

    if (manageableRoles.length === 0) {
      setSelectedRoleId("");
      setRoleForm(EMPTY_ROLE_FORM);
      setSelectedPermissionIds([]);
      return;
    }

    const targetId =
      preferredRoleId &&
        manageableRoles.some((role) => role._id === preferredRoleId)
        ? preferredRoleId
        : manageableRoles[0]._id;
    const targetRole = roleList.find((role) => role._id === targetId);

    setSelectedRoleId(targetId);
    setRoleForm(mapRoleToForm(targetRole));
    setSelectedPermissionIds(extractRolePermissionIds(targetRole));
  }, [isSuperAdmin]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [permissionsMap] = await Promise.all([
        adminOverviewService.getGroupedPermissions(),
        refreshRoles(),
      ]);

      setGroupedPermissions(permissionsMap);
    } catch (nextError) {
      setError(nextError.message || "");
    } finally {
      setLoading(false);
    }
  }, [refreshRoles]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const loadSelectedRolePermissions = async () => {
      if (!selectedRoleId || isCreating) return;
      try {
        const permissions = await adminOverviewService.getRolePermissions(selectedRoleId);
        const permissionIds = permissions
          .map((permission) => getPermissionId(permission))
          .filter(Boolean);
        setSelectedPermissionIds(permissionIds);
      } catch (nextError) {
        setError(nextError.message || "");
      }
    };

    loadSelectedRolePermissions();
  }, [selectedRoleId, isCreating]);

  const onSelectRole = (role) => {
    setIsCreating(false);
    setSuccess("");
    setError("");
    setSelectedRoleId(role._id);
    setRoleForm(mapRoleToForm(role));
    setSelectedPermissionIds(extractRolePermissionIds(role));
  };

  const onCreateRoleMode = () => {
    if (!canManageRoles) return;
    setIsCreating(true);
    setSelectedRoleId("");
    setRoleForm(EMPTY_ROLE_FORM);
    setSelectedPermissionIds([]);
    setSuccess("");
    setError("");
  };

  const onFormChange = (field, value) => {
    if (!canManageRoles) return;
    setRoleForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && isCreating) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const togglePermission = (permissionId) => {
    if (!canManageRoles) return;
    setSelectedPermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      }
      return [...prev, permissionId];
    });
  };

  const toggleModulePermissions = (moduleName) => {
    if (!canManageRoles) return;
    const modulePermissionIds = (groupedPermissions[moduleName] || [])
      .map((permission) => permission?._id)
      .filter(Boolean);

    setSelectedPermissionIds((prev) => {
      const hasAll = modulePermissionIds.every((id) => prev.includes(id));
      if (hasAll) {
        return prev.filter((id) => !modulePermissionIds.includes(id));
      }
      return Array.from(new Set([...prev, ...modulePermissionIds]));
    });
  };

  const toggleAllPermissions = () => {
    if (!canManageRoles) return;
    const allPermissionIds = moduleNames.flatMap((moduleName) =>
      (groupedPermissions[moduleName] || [])
        .map((permission) => permission?._id)
        .filter(Boolean)
    );

    const allSelected =
      allPermissionIds.length > 0 &&
      allPermissionIds.every((permissionId) =>
        selectedPermissionIds.includes(permissionId)
      );

    if (allSelected) {
      setSelectedPermissionIds([]);
      return;
    }
    setSelectedPermissionIds(Array.from(new Set(allPermissionIds)));
  };

  const onSaveRole = async () => {
    if (!canManageRoles) {
      setError("");
      return;
    }
    if (!roleForm.name.trim()) {
      setError("");
      return;
    }
    if (!roleForm.slug.trim()) {
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (isCreating) {
        const createdRole = await adminOverviewService.createRole({
          name: roleForm.name.trim(),
          slug: roleForm.slug.trim(),
          description: roleForm.description.trim(),
          scope: roleForm.scope,
          permission_ids: selectedPermissionIds,
        });

        await refreshRoles(createdRole?._id);
        setIsCreating(false);
        setSuccess("");
      } else {
        if (!selectedRoleId) {
          throw new Error("");
        }

        await adminOverviewService.updateRole(selectedRoleId, {
          name: roleForm.name.trim(),
          slug: roleForm.slug.trim(),
          description: roleForm.description.trim(),
          scope: roleForm.scope,
        });

        await adminOverviewService.replaceRolePermissions(
          selectedRoleId,
          selectedPermissionIds
        );

        await refreshRoles(selectedRoleId);
        setSuccess("");
      }
    } catch (nextError) {
      setError(nextError.message || "");
    } finally {
      setSaving(false);
    }
  };

  const renderLeftPanel = () => (
    <aside className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Available Roles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRoles.length} active roles
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateRoleMode}
          disabled={!canManageRoles}
          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + Add New
        </button>
      </div>

      <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
        {activeRoles.map((role) => {
          const isActive = !isCreating && selectedRoleId === role._id;
          return (
            <button
              key={role._id}
              type="button"
              onClick={() => onSelectRole(role)}
              className={`w-full text-left border rounded-xl px-3 py-2.5 transition-all ${isActive
                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10"
                : "border-slate-200 hover:bg-slate-50"
                }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                {role.name || role.slug}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mt-0.5">
                {role.slug}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const renderPermissionTree = () => (
    <div className="space-y-3 mt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Permissions Tree</h3>
        <button
          type="button"
          onClick={toggleAllPermissions}
          disabled={!canManageRoles}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Select All
        </button>
      </div>

      {moduleNames.map((moduleName) => {
        const permissions = groupedPermissions[moduleName] || [];
        const selectedCount = permissions.filter((permission) =>
          selectedPermissionIds.includes(permission._id)
        ).length;
        const allSelected = permissions.length > 0 && selectedCount === permissions.length;

        return (
          <section
            key={moduleName}
            className="border border-slate-200 rounded-xl p-4 bg-slate-50/40"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800">
                {moduleName}
              </h4>
              <button
                type="button"
                onClick={() => toggleModulePermissions(moduleName)}
                disabled={!canManageRoles}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                {allSelected ? "Clear" : "Select All"} ({selectedCount}/{permissions.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {permissions.map((permission) => {
                const checked = selectedPermissionIds.includes(permission._id);
                return (
                  <label
                    key={permission._id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${checked
                      ? "bg-white border-slate-300"
                      : "bg-white/60 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission._id)}
                      disabled={!canManageRoles}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700">
                      {permission.name || permission.code}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-5">
      {renderLeftPanel()}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Roles & Permissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure user access levels and feature availability.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {currentEffectiveRoles.join(", ") || "user"}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-semibold">
            {selectedPermissionIds.length}/{totalPermissions} permissions selected
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2">
            {success}
          </div>
        )}
        {!canManageRoles && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">

          </div>
        )}

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ROLE NAME
            </label>
            <input
              value={roleForm.name}
              onChange={(event) => onFormChange("name", event.target.value)}
              disabled={!canManageRoles}
              placeholder="Administrator"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              SLUG (READ-ONLY)
            </label>
            <input
              value={roleForm.slug}
              readOnly
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-600"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={roleForm.description}
              onChange={(event) => onFormChange("description", event.target.value)}
              disabled={!canManageRoles}
              placeholder="Full access to all modules and system settings."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {renderPermissionTree()}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          {isCreating && (
            <button
              type="button"
              onClick={() => {
                if (activeRole) {
                  setIsCreating(false);
                  setRoleForm(mapRoleToForm(activeRole));
                  setSelectedRoleId(activeRole._id);
                  setSelectedPermissionIds(extractRolePermissionIds(activeRole));
                } else {
                  setRoleForm(EMPTY_ROLE_FORM);
                  setSelectedPermissionIds([]);
                }
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSaveRole}
            disabled={saving || !canManageRoles}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminRolesPage;
