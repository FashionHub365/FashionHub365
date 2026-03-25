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
    <aside className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-fit">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Role List</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeRoles.length} roles available
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateRoleMode}
            disabled={!canManageRoles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 stylish-scrollbar">
        {activeRoles.map((role) => {
          const isActive = !isCreating && selectedRoleId === role._id;
          return (
            <button
              key={role._id}
              type="button"
              onClick={() => onSelectRole(role)}
              className={`w-full text-left rounded-xl px-3 py-3 transition-all flex items-center gap-3 relative overflow-hidden group ${isActive
                ? "bg-indigo-50/50 border border-indigo-100 ring-1 ring-indigo-500/10"
                : "border border-transparent bg-white hover:bg-slate-50 hover:border-slate-200"
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full shadow-sm" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm tracking-tight truncate transition-colors ${isActive ? 'font-bold text-indigo-900' : 'font-semibold text-slate-700 group-hover:text-slate-900'}`}>
                  {role.name || role.slug}
                </p>
                <p className="text-[10px] uppercase font-medium tracking-wider text-slate-500 truncate mt-0.5">
                  {role.slug}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        .stylish-scrollbar::-webkit-scrollbar { width: 4px; }
        .stylish-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .stylish-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .stylish-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}</style>
    </aside>
  );

  const renderPermissionTree = () => (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Permission Tree</h3>
          <p className="text-xs text-slate-500 mt-1">Manage detailed access permissions for each function.</p>
        </div>
        <button
          type="button"
          onClick={toggleAllPermissions}
          disabled={!canManageRoles}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100/50"
        >
          {selectedPermissionIds.length === totalPermissions ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Deselect All</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Select All</>
          )}
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 stylish-scrollbar">
        {moduleNames.map((moduleName) => {
          const permissions = groupedPermissions[moduleName] || [];
          const selectedCount = permissions.filter((permission) =>
            selectedPermissionIds.includes(permission._id)
          ).length;
          const allSelected = permissions.length > 0 && selectedCount === permissions.length;

          return (
            <section
              key={moduleName}
              className={`border rounded-2xl p-4 transition-colors ${allSelected ? 'bg-indigo-50/30 border-indigo-200/60' : 'bg-slate-50/50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-6 rounded-full ${allSelected ? 'bg-indigo-500' : (selectedCount > 0 ? 'bg-amber-400' : 'bg-slate-300')}`}></div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    {moduleName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${allSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedCount}/{permissions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleModulePermissions(moduleName)}
                  disabled={!canManageRoles}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wide"
                >
                  {allSelected ? "Deselect" : "Select this group"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {permissions.map((permission) => {
                  const checked = selectedPermissionIds.includes(permission._id);
                  return (
                    <div
                      key={permission._id}
                      onClick={() => { if (canManageRoles) togglePermission(permission._id) }}
                      className={`relative flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${checked
                        ? "bg-white border-indigo-400 shadow-[0_2px_10px_-4px_rgba(79,70,229,0.3)] ring-1 ring-indigo-400/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                        } ${!canManageRoles ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-bold leading-snug truncate transition-colors ${checked ? 'text-indigo-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {permission.name || permission.code}
                        </span>
                        <div className={`shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'}`}>
                          {checked && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate" title={permission.code}>
                        {permission.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manage Roles & Permissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Set up permission groups to assign to system users.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {currentEffectiveRoles.join(", ") || "user"}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-xs text-indigo-700 font-bold whitespace-nowrap">
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
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Role Name
            </label>
            <input
              value={roleForm.name}
              onChange={(event) => onFormChange("name", event.target.value)}
              disabled={!canManageRoles}
              placeholder="Example: Administrator"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              System Code (Read-only)
            </label>
            <input
              value={roleForm.slug}
              readOnly
              className="w-full border border-slate-200 bg-slate-100/70 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-mono"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={roleForm.description}
              onChange={(event) => onFormChange("description", event.target.value)}
              disabled={!canManageRoles}
              placeholder="Description of permissions and scope of this role..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
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
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSaveRole}
            disabled={saving || !canManageRoles}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {saving ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminRolesPage;
