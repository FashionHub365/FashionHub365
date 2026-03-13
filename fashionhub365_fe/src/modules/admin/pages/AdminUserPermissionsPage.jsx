import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ADMIN_TIER_ROLE_SLUGS,
  extractRawRoleSlugs,
  getStatusDisplay,
  getUserRoleSlugs,
} from "../../../utils/roleUtils";
import { adminOverviewService } from "../services/adminOverviewService";

const normalizeDirectEffect = (value) =>
  String(value || "ALLOW").trim().toUpperCase() === "DENY" ? "DENY" : "ALLOW";

const parseMeta = (meta, fallbackPage, fallbackLimit, fallbackTotal) => {
  const page = Number(meta?.page || meta?.pagination?.page || fallbackPage || 1);
  const limit = Number(meta?.limit || meta?.pagination?.limit || fallbackLimit || 10);
  const total = Number(meta?.total || meta?.pagination?.total || fallbackTotal || 0);
  return {
    page: Number.isFinite(page) && page > 0 ? page : fallbackPage,
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallbackLimit,
    total: Number.isFinite(total) && total >= 0 ? total : fallbackTotal,
  };
};

const getDisplayName = (user) =>
  user?.profile?.full_name || user?.username || user?.email || "N/A";

const getStatus = (user) => {
  const raw = user?.status || user?.account_status || "";
  if (raw) return String(raw).toUpperCase();
  if (typeof user?.is_active === "boolean") return user.is_active ? "ACTIVE" : "INACTIVE";
  return "UNKNOWN";
};

const extractDirectPermissionCode = (override) => {
  const directCode = typeof override?.permissionCode === "string" ? override.permissionCode : "";
  if (directCode) return directCode;
  const nestedCode = typeof override?.permission_id?.code === "string" ? override.permission_id.code : "";
  return nestedCode || "";
};

const extractDirectPermissionId = (override) => {
  const permissionId = override?.permission_id?._id || override?.permission_id;
  return permissionId ? String(permissionId) : "";
};

const PermissionList = ({ title, values, tone = "slate" }) => {
  const colorClass = tone === "rose"
    ? "bg-rose-50 text-rose-700"
    : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-700";
  return (
    <div className="border border-slate-200 rounded-xl p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {title} ({values.length})
      </p>
      {values.length === 0 ? (
        <p className="text-sm text-slate-500">No permissions.</p>
      ) : (
        <div className="max-h-[180px] overflow-y-auto flex flex-wrap gap-1.5">
          {values.map((code) => (
            <span
              key={`${title}-${code}`}
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
            >
              {code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminUserPermissionsPage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingPermissionCatalog, setLoadingPermissionCatalog] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [permissionCatalog, setPermissionCatalog] = useState([]);

  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("ALLOW");
  const [permissionNote, setPermissionNote] = useState("");
  const [savingDirectPermission, setSavingDirectPermission] = useState(false);
  const [removingDirectPermissionIds, setRemovingDirectPermissionIds] = useState([]);

  const [directPermissions, setDirectPermissions] = useState([]);
  const [directAllowPermissions, setDirectAllowPermissions] = useState([]);
  const [directDenyPermissions, setDirectDenyPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [effectivePermissions, setEffectivePermissions] = useState([]);

  const currentEffectiveRoles = useMemo(() => getUserRoleSlugs(currentUser), [currentUser]);
  const currentRawRoles = useMemo(() => extractRawRoleSlugs(currentUser), [currentUser]);
  const isSuperAdmin =
    currentRawRoles.includes("super-admin") || currentEffectiveRoles.includes("super-admin");
  const isAdmin = currentRawRoles.includes("admin") || currentEffectiveRoles.includes("admin");
  const canManageUsers = isSuperAdmin || isAdmin;

  const canManageTargetUser = useCallback(
    (targetUser) => {
      if (!canManageUsers || !targetUser) return false;
      const roleSlugs = extractRawRoleSlugs(targetUser);
      const isTargetSuperAdmin = roleSlugs.includes("super-admin");
      const isTargetAdminTier = roleSlugs.some((role) => ADMIN_TIER_ROLE_SLUGS.has(role));
      if (isTargetSuperAdmin) return false;
      if (isSuperAdmin) return true;
      if (isAdmin) return !isTargetAdminTier;
      return false;
    },
    [canManageUsers, isAdmin, isSuperAdmin]
  );

  const selectedUser = useMemo(
    () => users.find((item) => String(item?._id) === String(selectedUserId)) || null,
    [users, selectedUserId]
  );

  const totalPages = useMemo(() => {
    const safeLimit = Math.max(limit, 1);
    return Math.max(Math.ceil(total / safeLimit), 1);
  }, [limit, total]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");
    try {
      const result = await adminOverviewService.getUsers({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy: "created_at",
        order: "desc",
      });

      const nextUsers = Array.isArray(result?.users) ? result.users : [];
      const parsedMeta = parseMeta(result?.meta, page, limit, nextUsers.length);
      setUsers(nextUsers);
      setPage(parsedMeta.page);
      setLimit(parsedMeta.limit);
      setTotal(parsedMeta.total);
    } catch (nextError) {
      setError(nextError.message || "Unable to load users list.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoadingUsers(false);
    }
  }, [limit, page, search, statusFilter]);

  const loadPermissionCatalog = useCallback(async () => {
    setLoadingPermissionCatalog(true);
    try {
      const grouped = await adminOverviewService.getGroupedPermissions();
      const all = Object.values(grouped || {})
        .flat()
        .filter(Boolean);
      const uniqueById = new Map();
      all.forEach((permission) => {
        if (permission?._id) uniqueById.set(String(permission._id), permission);
      });
      const nextPermissions = Array.from(uniqueById.values()).sort((a, b) => {
        const moduleA = String(a?.module || "");
        const moduleB = String(b?.module || "");
        if (moduleA !== moduleB) return moduleA.localeCompare(moduleB);
        const codeA = String(a?.code || "");
        const codeB = String(b?.code || "");
        return codeA.localeCompare(codeB);
      });
      setPermissionCatalog(nextPermissions);
      if (!selectedPermissionId && nextPermissions.length > 0) {
        setSelectedPermissionId(String(nextPermissions[0]._id));
      }
    } catch (nextError) {
      setError(nextError.message || "Unable to load permission catalog.");
      setPermissionCatalog([]);
    } finally {
      setLoadingPermissionCatalog(false);
    }
  }, [selectedPermissionId]);

  const loadUserPermissionDetail = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingDetail(true);
    setError("");
    try {
      const [directRes, effectiveRes] = await Promise.all([
        adminOverviewService.getUserDirectPermissions(userId),
        adminOverviewService.getUserEffectivePermissions(userId),
      ]);

      setDirectPermissions(Array.isArray(directRes?.directPermissions) ? directRes.directPermissions : []);
      setDirectAllowPermissions(
        Array.isArray(effectiveRes?.directAllowPermissions) ? effectiveRes.directAllowPermissions : []
      );
      setDirectDenyPermissions(
        Array.isArray(effectiveRes?.directDenyPermissions) ? effectiveRes.directDenyPermissions : []
      );
      setRolePermissions(Array.isArray(effectiveRes?.rolePermissions) ? effectiveRes.rolePermissions : []);
      setEffectivePermissions(
        Array.isArray(effectiveRes?.effectivePermissions) ? effectiveRes.effectivePermissions : []
      );
    } catch (nextError) {
      setError(nextError.message || "Unable to load user permission detail.");
      setDirectPermissions([]);
      setDirectAllowPermissions([]);
      setDirectDenyPermissions([]);
      setRolePermissions([]);
      setEffectivePermissions([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadPermissionCatalog();
  }, [loadPermissionCatalog]);

  useEffect(() => {
    if (users.length === 0) {
      setSelectedUserId("");
      return;
    }
    const queryUserId = String(searchParams.get("userId") || "");
    if (queryUserId && users.some((item) => String(item?._id) === queryUserId)) {
      setSelectedUserId(queryUserId);
      return;
    }
    if (selectedUserId && users.some((item) => String(item?._id) === String(selectedUserId))) {
      return;
    }
    const firstManageable = users.find((item) => canManageTargetUser(item));
    const fallbackId = firstManageable?._id || users[0]?._id || "";
    setSelectedUserId(String(fallbackId || ""));
  }, [canManageTargetUser, searchParams, selectedUserId, users]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadUserPermissionDetail(selectedUserId);
  }, [loadUserPermissionDetail, selectedUserId]);

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const onSelectUser = (userId) => {
    const nextId = String(userId || "");
    setSelectedUserId(nextId);
    if (nextId) {
      setSearchParams({ userId: nextId });
    } else {
      setSearchParams({});
    }
  };

  const onApplyDirectPermission = async () => {
    if (!selectedUser?._id) return;
    if (!canManageTargetUser(selectedUser)) {
      setError("You do not have permission to manage this account.");
      return;
    }
    if (!selectedPermissionId) {
      setError("Please select a permission.");
      return;
    }

    setSavingDirectPermission(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.upsertUserDirectPermission(selectedUser._id, {
        permissionId: selectedPermissionId,
        effect: normalizeDirectEffect(selectedEffect),
        note: permissionNote,
      });
      setPermissionNote("");
      await loadUserPermissionDetail(selectedUser._id);
      const selectedPermission = permissionCatalog.find(
        (permission) => String(permission._id) === String(selectedPermissionId)
      );
      const code = selectedPermission?.code || "permission";
      setSuccess(`${normalizeDirectEffect(selectedEffect)} override saved for ${code}.`);
    } catch (nextError) {
      setError(nextError.message || "Failed to apply direct permission.");
    } finally {
      setSavingDirectPermission(false);
    }
  };

  const onRemoveDirectPermission = async (permissionId) => {
    if (!selectedUser?._id || !permissionId) return;
    if (!canManageTargetUser(selectedUser)) {
      setError("You do not have permission to manage this account.");
      return;
    }
    if (!window.confirm("Remove this direct permission override?")) return;

    setRemovingDirectPermissionIds((prev) => Array.from(new Set([...prev, String(permissionId)])));
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.deleteUserDirectPermission(selectedUser._id, permissionId);
      await loadUserPermissionDetail(selectedUser._id);
      setSuccess("Direct permission override removed.");
    } catch (nextError) {
      setError(nextError.message || "Failed to remove direct permission.");
    } finally {
      setRemovingDirectPermissionIds((prev) => prev.filter((id) => id !== String(permissionId)));
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">User Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user-specific permission overrides (ALLOW / DENY).
          </p>
        </div>
      </div>

      {!canManageUsers && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
          This account has read-only access and cannot apply permission overrides.
        </div>
      )}

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

      <form className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr,180px,120px] gap-2.5" onSubmit={onSubmitSearch}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, username, email..."
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="BANNED">BANNED</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            Users ({total})
          </div>
          {loadingUsers ? (
            <div className="py-10 flex justify-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-900" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No users found.</div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto">
              {users.map((item) => {
                const active = String(item?._id) === String(selectedUserId);
                const status = getStatus(item);
                const statusDisplay = getStatusDisplay(status);
                return (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => onSelectUser(item._id)}
                    className={`w-full text-left px-3 py-3 border-b border-slate-100 transition-colors ${
                      active ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 truncate">{getDisplayName(item)}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.email || "-"}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.color}`} />
                      <span className="text-[11px] text-slate-500">{statusDisplay.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-3 py-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          {!selectedUser ? (
            <p className="text-sm text-slate-500">Select a user to manage permissions.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{getDisplayName(selectedUser)}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email || "-"}</p>
              </div>

              {!canManageTargetUser(selectedUser) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
                  You cannot modify permissions for this account.
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-slate-900">Apply direct permission</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ALLOW grants permission to this user only. DENY blocks it even if role has it.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr,140px] gap-2">
                  <select
                    value={selectedPermissionId}
                    onChange={(event) => setSelectedPermissionId(event.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    disabled={loadingPermissionCatalog || loadingDetail}
                  >
                    <option value="">
                      {loadingPermissionCatalog ? "Loading permissions..." : "Select permission..."}
                    </option>
                    {permissionCatalog.map((permission) => (
                      <option key={permission._id} value={permission._id}>
                        [{permission.module}] {permission.code} - {permission.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedEffect}
                    onChange={(event) => setSelectedEffect(normalizeDirectEffect(event.target.value))}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    disabled={loadingDetail}
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                  </select>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2">
                  <input
                    value={permissionNote}
                    onChange={(event) => setPermissionNote(event.target.value)}
                    placeholder="Note (optional)"
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    disabled={savingDirectPermission || loadingDetail}
                  />
                  <button
                    type="button"
                    onClick={onApplyDirectPermission}
                    disabled={
                      !canManageTargetUser(selectedUser) ||
                      !selectedPermissionId ||
                      loadingDetail ||
                      savingDirectPermission
                    }
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {savingDirectPermission ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-slate-900">Current direct overrides</h3>
                <div className="mt-2 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {loadingDetail ? (
                    <p className="text-sm text-slate-500">Loading permission detail...</p>
                  ) : directPermissions.length === 0 ? (
                    <p className="text-sm text-slate-500">No direct overrides.</p>
                  ) : (
                    directPermissions.map((override) => {
                      const permissionId = extractDirectPermissionId(override);
                      const code = extractDirectPermissionCode(override) || "-";
                      const effect = normalizeDirectEffect(override?.effect);
                      const isRemoving = removingDirectPermissionIds.includes(String(permissionId));
                      return (
                        <div
                          key={`${override?._id || permissionId}-${code}`}
                          className="border border-slate-200 rounded-lg px-3 py-2 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  effect === "DENY"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {effect}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 break-all">{code}</span>
                            </div>
                            {override?.note ? (
                              <p className="text-xs text-slate-500 mt-1">{override.note}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveDirectPermission(permissionId)}
                            disabled={!canManageTargetUser(selectedUser) || isRemoving || !permissionId}
                            className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {isRemoving ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PermissionList title="Role Permissions" values={rolePermissions} />
                <PermissionList title="Direct Allow" values={directAllowPermissions} tone="emerald" />
                <PermissionList title="Direct Deny" values={directDenyPermissions} tone="rose" />
              </div>

              <PermissionList title="Effective Permissions" values={effectivePermissions} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminUserPermissionsPage;
