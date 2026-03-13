import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ADMIN_TIER_ROLE_SLUGS,
  extractRawRoleSlugs,
  extractRoleIdsFromUser,
  getAccountType,
  getStatusDisplay,
  getUserRoleSlugs
} from "../../../utils/roleUtils";
import { adminOverviewService } from "../services/adminOverviewService";

const normalizeRole = (value) => String(value || "").trim().toLowerCase();
const normalizeScope = (value) => String(value || "").trim().toUpperCase();
const normalizeDirectEffect = (value) =>
  String(value || "ALLOW").trim().toUpperCase() === "DENY" ? "DENY" : "ALLOW";

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

const getDisplayName = (user) =>
  user?.profile?.full_name || user?.username || user?.email || "N/A";

const getStatus = (user) => {
  const raw = user?.status || user?.account_status || "";
  if (raw) return String(raw).toUpperCase();
  if (typeof user?.is_active === "boolean") {
    return user.is_active ? "ACTIVE" : "INACTIVE";
  }
  return "UNKNOWN";
};

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

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [fullRoles, setFullRoles] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissionCatalog, setLoadingPermissionCatalog] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedStoreRoleIds, setSelectedStoreRoleIds] = useState([]);
  const [userStoreRoles, setUserStoreRoles] = useState([]);
  const [userDirectPermissions, setUserDirectPermissions] = useState([]);
  const [selectedDirectPermissionId, setSelectedDirectPermissionId] = useState("");
  const [selectedDirectEffect, setSelectedDirectEffect] = useState("ALLOW");
  const [directPermissionNote, setDirectPermissionNote] = useState("");
  const [stores, setStores] = useState([]);
  const [loadingAssignContext, setLoadingAssignContext] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [savingStoreRoles, setSavingStoreRoles] = useState(false);
  const [savingDirectPermission, setSavingDirectPermission] = useState(false);
  const [removingDirectPermissionIds, setRemovingDirectPermissionIds] = useState([]);
  const [processingUserIds, setProcessingUserIds] = useState([]);

  const roleById = useMemo(
    () => new Map(roles.map((role) => [String(role._id), role])),
    [roles]
  );

  const fullRoleById = useMemo(
    () => new Map(fullRoles.map((role) => [String(role._id), role])),
    [fullRoles]
  );

  const permissionById = useMemo(
    () => new Map(permissionCatalog.map((permission) => [String(permission._id), permission])),
    [permissionCatalog]
  );

  const roleBySlug = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => {
      const slug = normalizeRole(role?.slug || role?.name);
      if (slug) map.set(slug, role);
    });
    return map;
  }, [roles]);

  const currentEffectiveRoles = useMemo(
    () => getUserRoleSlugs(currentUser),
    [currentUser]
  );

  const currentRawRoles = useMemo(() => extractRawRoleSlugs(currentUser), [currentUser]);

  const isSuperAdmin =
    currentRawRoles.includes("super-admin") ||
    currentEffectiveRoles.includes("super-admin");
  const isAdmin =
    currentRawRoles.includes("admin") || currentEffectiveRoles.includes("admin");
  const canManageUsers = isSuperAdmin || isAdmin;

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      let roleList = [];
      let roleDetails = [];
      try {
        const [optionsRes, detailsRes] = await Promise.all([
          adminOverviewService.getRoleOptions(),
          adminOverviewService.getRoles({
            page: 1,
            limit: 200,
            includeDeleted: false,
            sortBy: "name",
            order: "asc",
          }),
        ]);
        roleList = Array.isArray(optionsRes) ? optionsRes : [];
        roleDetails = Array.isArray(detailsRes) ? detailsRes : [];
      } catch (error) {
        roleDetails = await adminOverviewService.getRoles({
          page: 1,
          limit: 200,
          includeDeleted: false,
          sortBy: "name",
          order: "asc",
        });
        roleList = Array.isArray(roleDetails)
          ? roleDetails.map((role) => ({
            _id: role._id,
            name: role.name,
            slug: role.slug,
            scope: role.scope,
            deleted_at: role.deleted_at,
          }))
          : [];
      }
      setRoles(Array.isArray(roleList) ? roleList : []);
      setFullRoles(Array.isArray(roleDetails) ? roleDetails : []);
    } catch (nextError) {
      setError(nextError.message || "Unable to load roles list.");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const loadPermissionCatalog = useCallback(async () => {
    setLoadingPermissionCatalog(true);
    try {
      const grouped = await adminOverviewService.getGroupedPermissions();
      const all = Object.values(grouped || {})
        .flat()
        .filter(Boolean);
      const uniqueById = new Map();
      all.forEach((permission) => {
        if (permission?._id) {
          uniqueById.set(String(permission._id), permission);
        }
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
      if (!selectedDirectPermissionId && nextPermissions.length > 0) {
        setSelectedDirectPermissionId(String(nextPermissions[0]._id));
      }
    } catch (nextError) {
      setError(nextError.message || "Unable to load permission list.");
      setPermissionCatalog([]);
    } finally {
      setLoadingPermissionCatalog(false);
    }
  }, [selectedDirectPermissionId]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy: "created_at",
        order: "desc",
      };

      const result = await adminOverviewService.getUsers(params);
      const nextUsers = Array.isArray(result?.users) ? result.users : [];
      setUsers(nextUsers);

      const parsedMeta = parseMeta(result?.meta, page, limit, nextUsers.length);
      setPage(parsedMeta.page);
      setLimit(parsedMeta.limit);
      setTotal(parsedMeta.total);
    } catch (nextError) {
      setError(nextError.message || "Unable to load users list.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadPermissionCatalog();
  }, [loadPermissionCatalog]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const decoratedUsers = useMemo(
    () =>
      users.map((item) => {
        const roleSlugs = extractRawRoleSlugs(item, roleById);
        const isSuperAdminAccount = roleSlugs.includes("super-admin");
        const isAdminTierAccount = roleSlugs.some((role) =>
          ADMIN_TIER_ROLE_SLUGS.has(role)
        );
        const accountType = getAccountType(roleSlugs);
        return {
          ...item,
          _roleSlugs: roleSlugs,
          _isSuperAdminAccount: isSuperAdminAccount,
          _isAdminTierAccount: isAdminTierAccount,
          _accountType: accountType,
        };
      }),
    [users, roleById]
  );

  const visibleUsers = useMemo(() => {
    // We strictly map properties here and DO NOT filter things out 
    // simply because they are higher role. The Backend already 
    // handles permissions properly to not return users we can't manage
    // (except returning super-admins/admins occasionally if required). 
    // We just show whatever the BE returns and disable buttons if not allowed.

    let filtered = decoratedUsers;
    if (accountTypeFilter !== "all") {
      filtered = filtered.filter((item) => item._accountType === accountTypeFilter);
    }
    return filtered;
  }, [decoratedUsers, accountTypeFilter]);

  const totalPages = useMemo(() => {
    const safeLimit = Math.max(limit, 1);
    return Math.max(Math.ceil(total / safeLimit), 1);
  }, [total, limit]);

  const assignableRoles = useMemo(() => {
    const activeRoles = roles.filter((role) => !role.deleted_at);
    if (isSuperAdmin) {
      return activeRoles.filter(
        (role) => normalizeRole(role.slug) !== "super-admin"
      );
    }
    if (isAdmin) {
      return activeRoles.filter(
        (role) => !ADMIN_TIER_ROLE_SLUGS.has(normalizeRole(role.slug))
      );
    }
    return [];
  }, [roles, isSuperAdmin, isAdmin]);

  const globalAssignableRoles = useMemo(
    () =>
      assignableRoles.filter(
        (role) => normalizeScope(role?.scope || "GLOBAL") === "GLOBAL"
      ),
    [assignableRoles]
  );

  const storeAssignableRoles = useMemo(
    () =>
      assignableRoles.filter(
        (role) => normalizeScope(role?.scope) === "STORE"
      ),
    [assignableRoles]
  );

  const effectivePermissionCodesForSelectedUser = useMemo(() => {
    if (!selectedUser) return [];

    const effectiveRoleIds = new Set(
      (selectedRoleIds || []).map((id) => String(id))
    );

    (userStoreRoles || []).forEach((member) => {
      const storeId = String(member?.store_id?._id || member?.store_id || "");
      const roleIdsFromMember = Array.isArray(member?.role_ids)
        ? member.role_ids
          .map((roleLike) => (typeof roleLike === "string" ? roleLike : roleLike?._id))
          .filter(Boolean)
        : [];

      const finalRoleIds =
        selectedStoreId && storeId === String(selectedStoreId)
          ? selectedStoreRoleIds
          : roleIdsFromMember;

      finalRoleIds.forEach((id) => effectiveRoleIds.add(String(id)));
    });

    const permissionCodes = new Set();
    effectiveRoleIds.forEach((roleId) => {
      const role = fullRoleById.get(String(roleId));
      const permissions = Array.isArray(role?.permission_ids) ? role.permission_ids : [];
      permissions.forEach((permission) => {
        const code = typeof permission === "string" ? permission : permission?.code;
        if (code) permissionCodes.add(code);
      });
    });

    (userDirectPermissions || []).forEach((override) => {
      const code = extractDirectPermissionCode(override);
      if (!code) return;
      if (normalizeDirectEffect(override?.effect) === "DENY") {
        permissionCodes.delete(code);
      } else {
        permissionCodes.add(code);
      }
    });

    return Array.from(permissionCodes).sort();
  }, [
    fullRoleById,
    selectedRoleIds,
    selectedStoreId,
    selectedStoreRoleIds,
    selectedUser,
    userDirectPermissions,
    userStoreRoles,
  ]);

  const selectedAccountType = useMemo(() => {
    if (!selectedUser) return "";
    if (selectedUser._accountType) return selectedUser._accountType;
    return getAccountType(extractRawRoleSlugs(selectedUser, roleById));
  }, [selectedUser, roleById]);

  const showGlobalRoleEditor = selectedAccountType !== "SELLER";
  const showStoreRoleEditor = selectedAccountType === "SELLER";

  const canManageTargetUser = useCallback(
    (targetUser) => {
      if (!canManageUsers || !targetUser) return false;
      const roleSlugs = extractRawRoleSlugs(targetUser, roleById);
      const isTargetSuperAdmin = roleSlugs.includes("super-admin");
      const isTargetAdminTier = roleSlugs.some((role) =>
        ADMIN_TIER_ROLE_SLUGS.has(role)
      );

      if (isTargetSuperAdmin) return false;
      if (isSuperAdmin) return true;
      if (isAdmin) return !isTargetAdminTier;
      return false;
    },
    [canManageUsers, roleById, isSuperAdmin, isAdmin]
  );

  const getStoreRoleIdsForStore = useCallback((storeRoles, storeId) => {
    if (!storeId) return [];
    const member = (storeRoles || []).find(
      (item) => String(item?.store_id?._id || item?.store_id) === String(storeId)
    );
    if (!member || !Array.isArray(member.role_ids)) return [];
    return member.role_ids
      .map((roleLike) => (typeof roleLike === "string" ? roleLike : roleLike?._id))
      .filter(Boolean);
  }, []);

  const refreshDirectPermissions = useCallback(
    async (userId) => {
      if (!userId) return;
      const directRes = await adminOverviewService.getUserDirectPermissions(userId);
      setUserDirectPermissions(
        Array.isArray(directRes?.directPermissions) ? directRes.directPermissions : []
      );
    },
    []
  );

  const openAssignRoleModal = async (targetUser) => {
    if (!canManageTargetUser(targetUser)) return;
    setError("");
    setSuccess("");
    setSelectedUser(targetUser);
    setSelectedRoleIds(
      extractRoleIdsFromUser(targetUser, roleBySlug).filter((roleId) => {
        const role = roleById.get(String(roleId));
        return normalizeScope(role?.scope || "GLOBAL") === "GLOBAL";
      })
    );
    setSelectedStoreRoleIds([]);
    setSelectedStoreId("");
    setUserStoreRoles([]);
    setUserDirectPermissions([]);
    setSelectedDirectEffect("ALLOW");
    setDirectPermissionNote("");
    if (permissionCatalog.length > 0) {
      setSelectedDirectPermissionId(String(permissionCatalog[0]._id));
    } else {
      setSelectedDirectPermissionId("");
    }
    setLoadingAssignContext(true);

    try {
      const [userRolesRes, storesRes, directRes] = await Promise.all([
        adminOverviewService.getUserRoles(targetUser._id),
        adminOverviewService.getStores({ page: 1, limit: 100, sort: "name_asc" }),
        adminOverviewService.getUserDirectPermissions(targetUser._id),
      ]);

      const nextStoreRoles = Array.isArray(userRolesRes?.storeRoles)
        ? userRolesRes.storeRoles
        : [];
      const nextStores = Array.isArray(storesRes?.stores) ? storesRes.stores : [];
      const nextDirectPermissions = Array.isArray(directRes?.directPermissions)
        ? directRes.directPermissions
        : [];

      setUserStoreRoles(nextStoreRoles);
      setStores(nextStores);
      setUserDirectPermissions(nextDirectPermissions);

      const preferredStoreId =
        nextStoreRoles[0]?.store_id?._id ||
        nextStoreRoles[0]?.store_id ||
        nextStores[0]?._id ||
        "";

      setSelectedStoreId(preferredStoreId);
      setSelectedStoreRoleIds(
        getStoreRoleIdsForStore(nextStoreRoles, preferredStoreId).filter((roleId) => {
          const role = roleById.get(String(roleId));
          return normalizeScope(role?.scope) === "STORE";
        })
      );
    } catch (nextError) {
      setError(nextError.message || "Unable to load role data for this account.");
    } finally {
      setLoadingAssignContext(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSelectedRoleIds([]);
    setSelectedStoreRoleIds([]);
    setSelectedStoreId("");
    setUserStoreRoles([]);
    setUserDirectPermissions([]);
    setSelectedDirectPermissionId("");
    setSelectedDirectEffect("ALLOW");
    setDirectPermissionNote("");
    setSavingDirectPermission(false);
    setRemovingDirectPermissionIds([]);
    setStores([]);
    setLoadingAssignContext(false);
    setSavingRoles(false);
    setSavingStoreRoles(false);
  };

  const toggleRoleId = (roleId) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const toggleStoreRoleId = (roleId) => {
    setSelectedStoreRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const onSaveUserRoles = async () => {
    if (!selectedUser?._id) return;
    if (!canManageTargetUser(selectedUser)) {
      setError("");
      return;
    }

    const allowedRoleIds = new Set(globalAssignableRoles.map((role) => role._id));
    const hasForbiddenRole = selectedRoleIds.some((id) => !allowedRoleIds.has(id));
    if (hasForbiddenRole) {
      setError("");
      return;
    }

    setSavingRoles(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.assignGlobalRoles(selectedUser._id, selectedRoleIds);
      setSuccess("");
      closeModal();
      await loadUsers();
    } catch (nextError) {
      setError(nextError.message || "Failed to update roles.");
      setSavingRoles(false);
    }
  };

  const onSaveStoreRoles = async () => {
    if (!selectedUser?._id) return;
    if (!canManageTargetUser(selectedUser)) {
      setError("");
      return;
    }
    if (!selectedStoreId) {
      setError("Please select a store before assigning store roles.");
      return;
    }

    const allowedRoleIds = new Set(storeAssignableRoles.map((role) => role._id));
    const hasForbiddenRole = selectedStoreRoleIds.some((id) => !allowedRoleIds.has(id));
    if (hasForbiddenRole) {
      setError("");
      return;
    }

    setSavingStoreRoles(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.assignStoreRoles(
        selectedUser._id,
        selectedStoreId,
        selectedStoreRoleIds
      );
      setSuccess("");
      const rolesRes = await adminOverviewService.getUserRoles(selectedUser._id);
      const nextStoreRoles = Array.isArray(rolesRes?.storeRoles) ? rolesRes.storeRoles : [];
      setUserStoreRoles(nextStoreRoles);
      setSelectedStoreRoleIds(
        getStoreRoleIdsForStore(nextStoreRoles, selectedStoreId).filter((roleId) => {
          const role = roleById.get(String(roleId));
          return normalizeScope(role?.scope) === "STORE";
        })
      );
      await loadUsers();
    } catch (nextError) {
      setError(nextError.message || "Failed to update store roles.");
    } finally {
      setSavingStoreRoles(false);
    }
  };

  const onUpsertDirectPermission = async () => {
    if (!selectedUser?._id) return;
    if (!canManageTargetUser(selectedUser)) {
      setError("You do not have permission to manage this account.");
      return;
    }
    if (!selectedDirectPermissionId) {
      setError("Please select a permission.");
      return;
    }

    setSavingDirectPermission(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.upsertUserDirectPermission(selectedUser._id, {
        permissionId: selectedDirectPermissionId,
        effect: normalizeDirectEffect(selectedDirectEffect),
        note: directPermissionNote,
      });
      await refreshDirectPermissions(selectedUser._id);
      setDirectPermissionNote("");
      const selectedPermission = permissionById.get(String(selectedDirectPermissionId));
      const permissionCode = selectedPermission?.code || "permission";
      setSuccess(
        `${normalizeDirectEffect(selectedDirectEffect)} override saved for ${permissionCode}.`
      );
    } catch (nextError) {
      setError(nextError.message || "Failed to save direct permission.");
    } finally {
      setSavingDirectPermission(false);
    }
  };

  const onRemoveDirectPermission = async (permissionId) => {
    if (!selectedUser?._id || !permissionId) return;
    if (!window.confirm("Remove this direct permission override?")) return;

    setRemovingDirectPermissionIds((prev) =>
      Array.from(new Set([...prev, String(permissionId)]))
    );
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.deleteUserDirectPermission(selectedUser._id, permissionId);
      await refreshDirectPermissions(selectedUser._id);
      setSuccess("Direct permission override removed.");
    } catch (nextError) {
      setError(nextError.message || "Failed to remove direct permission.");
    } finally {
      setRemovingDirectPermissionIds((prev) =>
        prev.filter((id) => id !== String(permissionId))
      );
    }
  };

  const roleNamesForUser = useCallback(
    (user) => {
      const slugs = extractRawRoleSlugs(user, roleById);
      return slugs.map((slug) => roleBySlug.get(slug)?.name || slug);
    },
    [roleById, roleBySlug]
  );

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const onChangeStatusFilter = (value) => {
    setPage(1);
    setStatusFilter(value);
  };

  const onChangeAccountTypeFilter = (value) => {
    setPage(1);
    setAccountTypeFilter(value);
  };

  const runUserAction = async (userId, action) => {
    setProcessingUserIds((prev) => Array.from(new Set([...prev, userId])));
    setError("");
    setSuccess("");
    try {
      await action();
      await loadUsers();
    } catch (nextError) {
      setError(nextError.message || "Action failed.");
    } finally {
      setProcessingUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const onToggleLockUser = (userItem) => {
    if (!userItem?._id) return;
    const currentStatus = getStatus(userItem);
    const isLocked = currentStatus === "BANNED";
    const nextStatus = isLocked ? "ACTIVE" : "BANNED";
    const confirmMessage = isLocked
      ? "Are you sure you want to unlock this account?"
      : "Are you sure you want to lock this account?";
    if (!window.confirm(confirmMessage)) return;

    runUserAction(userItem._id, async () => {
      await adminOverviewService.updateUserStatus(
        userItem._id,
        nextStatus,
        isLocked ? "Unlock account" : "Locked by admin"
      );
      setSuccess(isLocked ? "Account unlocked successfully." : "Account locked successfully.");
    });
  };

  const onSoftDeleteUser = (userItem) => {
    if (!userItem?._id) return;
    const currentStatus = getStatus(userItem);
    const isInactive = currentStatus === "INACTIVE";

    if (isInactive) {
      if (!window.confirm("Restore this account to ACTIVE?")) return;
      runUserAction(userItem._id, async () => {
        await adminOverviewService.updateUserStatus(
          userItem._id,
          "ACTIVE",
          "Restored by admin"
        );
        setSuccess("Account restored successfully.");
      });
      return;
    }

    if (!window.confirm("Soft-delete this account?")) return;
    runUserAction(userItem._id, async () => {
      await adminOverviewService.deleteUser(userItem._id);
      setSuccess("Account soft-deleted.");
    });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Current roles: {currentEffectiveRoles.join(", ") || "user"}
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Only super-admin and admin can assign roles to users/sellers.
        </div>
      </div>

      {!canManageUsers && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
          This account has read-only access and cannot assign roles in admin.
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

      <form className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr,180px,180px,120px] gap-2.5" onSubmit={onSubmitSearch}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, username, email..."
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(event) => onChangeStatusFilter(event.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="BANNED">BANNED (Locked)</option>
        </select>
        <select
          value={accountTypeFilter}
          onChange={(event) => onChangeAccountTypeFilter(event.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All account types</option>
          <option value="USER">User</option>
          <option value="SELLER">Seller</option>
          {isSuperAdmin && <option value="ADMIN">Admin</option>}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
        {loading || loadingRoles ? (
          <div className="py-14 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">
            No accounts match the current filters.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[1080px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">User</th>
                <th className="px-3 py-2.5 text-left">Account Type</th>
                <th className="px-3 py-2.5 text-left">Roles</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((userItem) => {
                const canManageThisUser = canManageTargetUser(userItem);
                const roleNames = roleNamesForUser(userItem);
                const status = getStatus(userItem);
                const isProcessing = processingUserIds.includes(userItem._id);
                const isInactive = status === "INACTIVE";
                const isLocked = status === "BANNED";
                const statusDisplay = getStatusDisplay(status);
                return (
                  <tr key={userItem._id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${userItem.email || 'U'}&background=random&color=fff&rounded=true&bold=true`}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200"
                        />
                        <div>
                          <p className="text-slate-900 font-medium">{getDisplayName(userItem)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{userItem.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {userItem._accountType}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {roleNames.map((name) => (
                          <span
                            key={`${userItem._id}-${name}`}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.color}`}></span>
                        <span className={`text-[11px] font-bold ${status === "ACTIVE" ? 'text-emerald-600' :
                          status === "BANNED" || status === "LOCKED" ? 'text-amber-600' :
                            status === "DELETED" ? 'text-rose-600' : 'text-slate-500'
                          }`}>{statusDisplay.text}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignRoleModal(userItem)}
                          disabled={!canManageThisUser || isProcessing}
                          className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Role details
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/user-permissions?userId=${userItem._id}`)}
                          disabled={!canManageThisUser || isProcessing}
                          className="px-3 py-1.5 rounded-md border border-indigo-300 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          User permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleLockUser(userItem)}
                          disabled={!canManageThisUser || isProcessing || isInactive}
                          className="px-3 py-1.5 rounded-md border border-amber-300 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLocked ? "Unlock" : "Lock account"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSoftDeleteUser(userItem)}
                          disabled={!canManageThisUser || isProcessing}
                          className={`px-3 py-1.5 rounded-md border text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${isInactive
                            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            : "border-rose-300 text-rose-700 hover:bg-rose-50"
                            }`}
                        >
                          {isInactive ? "Restore" : "Soft delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        <p className="text-slate-500">
          Total: <span className="font-semibold text-slate-700">{total}</span> accounts
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-600">
            Page {page}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Assign roles to account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getDisplayName(selectedUser)} - {selectedUser.email || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Account type:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedAccountType || "USER"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="space-y-4">
                {loadingAssignContext ? (
                  <p className="text-sm text-slate-500">Loading role information for this account...</p>
                ) : (
                  <>
                    {showGlobalRoleEditor && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Global roles</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Applies to user/admin accounts with GLOBAL scope.
                        </p>
                        <div className="mt-2 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                          {globalAssignableRoles.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No assignable global roles.
                            </p>
                          ) : (
                            globalAssignableRoles.map((role) => {
                              const checked = selectedRoleIds.includes(role._id);
                              const fullRole = fullRoleById.get(String(role._id));
                              const permissions = Array.isArray(fullRole?.permission_ids) ? fullRole.permission_ids : [];
                              return (
                                <label
                                  key={role._id}
                                  className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-all ${checked
                                      ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                                      : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                    }`}
                                >
                                  <div className="pt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleRoleId(role._id)}
                                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900">{role.name}</p>
                                    <p className="text-xs text-slate-500 mb-2">{role.slug}</p>
                                    {permissions.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {permissions.map((p) => {
                                          const code = typeof p === "string" ? p : p.code;
                                          const name = typeof p === "string" ? p : p.name;
                                          return (
                                            <span
                                              key={code}
                                              title={name}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shadow-sm"
                                            >
                                              {code}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 italic mt-1">No permissions configured</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {showStoreRoleEditor && (
                      <div className={`${showGlobalRoleEditor ? "border-t border-slate-100 pt-4" : ""}`}>
                        <h4 className="text-sm font-semibold text-slate-900">Store roles (Seller)</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Select a store and assign STORE-scope roles for that seller in that store.
                        </p>

                        <div className="mt-2">
                          <select
                            value={selectedStoreId}
                            onChange={(event) => {
                              const nextStoreId = event.target.value;
                              setSelectedStoreId(nextStoreId);
                              setSelectedStoreRoleIds(
                                getStoreRoleIdsForStore(userStoreRoles, nextStoreId).filter((roleId) => {
                                  const role = roleById.get(String(roleId));
                                  return normalizeScope(role?.scope) === "STORE";
                                })
                              );
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="">Select store...</option>
                            {stores.map((store) => (
                              <option key={store._id} value={store._id}>
                                {store.name || store.slug}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-2 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                          {storeAssignableRoles.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No assignable store roles.
                            </p>
                          ) : (
                            storeAssignableRoles.map((role) => {
                              const checked = selectedStoreRoleIds.includes(role._id);
                              const fullRole = fullRoleById.get(String(role._id));
                              const permissions = Array.isArray(fullRole?.permission_ids) ? fullRole.permission_ids : [];
                              return (
                                <label
                                  key={role._id}
                                  className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-all ${checked
                                      ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                                      : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                    }`}
                                >
                                  <div className="pt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleStoreRoleId(role._id)}
                                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900">{role.name}</p>
                                    <p className="text-xs text-slate-500 mb-2">{role.slug}</p>
                                    {permissions.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {permissions.map((p) => {
                                          const code = typeof p === "string" ? p : p.code;
                                          const name = typeof p === "string" ? p : p.name;
                                          return (
                                            <span
                                              key={code}
                                              title={name}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shadow-sm"
                                            >
                                              {code}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 italic mt-1">No permissions configured</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Direct permissions (user-specific)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Use ALLOW or DENY to override permissions only for this account.
                      </p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr,140px] gap-2">
                        <select
                          value={selectedDirectPermissionId}
                          onChange={(event) => setSelectedDirectPermissionId(event.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          disabled={loadingAssignContext || loadingPermissionCatalog}
                        >
                          <option value="">
                            {loadingPermissionCatalog
                              ? "Loading permissions..."
                              : "Select permission..."}
                          </option>
                          {permissionCatalog.map((permission) => (
                            <option key={permission._id} value={permission._id}>
                              [{permission.module}] {permission.code} - {permission.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedDirectEffect}
                          onChange={(event) => setSelectedDirectEffect(normalizeDirectEffect(event.target.value))}
                          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          disabled={loadingAssignContext}
                        >
                          <option value="ALLOW">ALLOW</option>
                          <option value="DENY">DENY</option>
                        </select>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2">
                        <input
                          value={directPermissionNote}
                          onChange={(event) => setDirectPermissionNote(event.target.value)}
                          placeholder="Note (optional)"
                          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          disabled={loadingAssignContext || savingDirectPermission}
                        />
                        <button
                          type="button"
                          onClick={onUpsertDirectPermission}
                          disabled={
                            loadingAssignContext ||
                            loadingPermissionCatalog ||
                            savingDirectPermission ||
                            !selectedDirectPermissionId
                          }
                          className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {savingDirectPermission ? "Saving..." : "Apply direct permission"}
                        </button>
                      </div>

                      <div className="mt-3 max-h-[180px] overflow-y-auto space-y-2 pr-1">
                        {userDirectPermissions.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No direct permission overrides for this account.
                          </p>
                        ) : (
                          userDirectPermissions.map((override) => {
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
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${effect === "DENY"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-emerald-100 text-emerald-700"
                                        }`}
                                    >
                                      {effect}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 break-all">
                                      {code}
                                    </span>
                                  </div>
                                  {override?.note ? (
                                    <p className="text-xs text-slate-500 mt-1">{override.note}</p>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onRemoveDirectPermission(permissionId)}
                                  disabled={isRemoving || !permissionId}
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

                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-semibold text-slate-900">Current account permissions</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Effective permissions from roles plus direct ALLOW/DENY overrides.
                      </p>
                      <div className="mt-2 max-h-[180px] overflow-y-auto">
                        {effectivePermissionCodesForSelectedUser.length === 0 ? (
                          <p className="text-sm text-slate-500">This account has no permissions yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {effectivePermissionCodesForSelectedUser.map((code) => (
                              <span
                                key={code}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              {showGlobalRoleEditor && (
                <button
                  type="button"
                  onClick={onSaveUserRoles}
                  disabled={savingRoles || loadingAssignContext}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingRoles ? "Saving global roles..." : "Save global roles"}
                </button>
              )}
              {showStoreRoleEditor && (
                <button
                  type="button"
                  onClick={onSaveStoreRoles}
                  disabled={savingStoreRoles || loadingAssignContext}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {savingStoreRoles ? "Saving store roles..." : "Save store roles"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsersPage;
