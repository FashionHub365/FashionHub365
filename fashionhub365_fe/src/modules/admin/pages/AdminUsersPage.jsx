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
import { confirmAction, showSuccess, showError } from "../../../utils/swalUtils";

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
  const [activeModalTab, setActiveModalTab] = useState("roles");
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
    setActiveModalTab("roles");
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
    const isConfirmed = await confirmAction({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete this direct permission override?",
      icon: "warning"
    });
    if (!isConfirmed) return;

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

  const onToggleLockUser = async (userItem) => {
    if (!userItem?._id) return;
    const currentStatus = getStatus(userItem);
    const isLocked = currentStatus === "BANNED";
    const nextStatus = isLocked ? "ACTIVE" : "BANNED";
    const confirmMessage = isLocked
      ? "Are you sure you want to unlock this account?"
      : "Are you sure you want to lock this account?";

    const isConfirmed = await confirmAction({
      title: isLocked ? "Unlock Account" : "Lock Account",
      text: confirmMessage,
      icon: isLocked ? "info" : "warning"
    });
    if (!isConfirmed) return;

    runUserAction(userItem._id, async () => {
      await adminOverviewService.updateUserStatus(
        userItem._id,
        nextStatus,
        isLocked ? "Unlock account" : "Locked by admin"
      );
      setSuccess(isLocked ? "Account unlocked successfully." : "Account locked successfully.");
    });
  };

  const onSoftDeleteUser = async (userItem) => {
    if (!userItem?._id) return;
    const currentStatus = getStatus(userItem);
    const isInactive = currentStatus === "INACTIVE";

    if (isInactive) {
      const isConfirmed = await confirmAction({
        title: "Restore Account",
        text: "Are you sure you want to restore this account to ACTIVE status?",
        icon: "info"
      });
      if (!isConfirmed) return;
      runUserAction(userItem._id, async () => {
        await adminOverviewService.updateUserStatus(
          userItem._id,
          "ACTIVE",
          "Restored by admin"
        );
        showSuccess("Account restored successfully.");
      });
      return;
    }

    const isConfirmed = await confirmAction({
      title: "Delete Account",
      text: "Are you sure you want to soft-delete this account?",
      icon: "warning"
    });
    if (!isConfirmed) return;
    runUserAction(userItem._id, async () => {
      await adminOverviewService.deleteUser(userItem._id);
      setSuccess("Account soft-deleted.");
    });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">List User</h1>
          <p className="text-sm text-slate-500 mt-1">
            Role: <span className="font-semibold text-indigo-600">{currentEffectiveRoles.join(", ") || "user"}</span>
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Only Super Admin and Admin can assign roles.
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

      <form className="mt-5 grid grid-cols-1 md:grid-cols-[1fr,150px,160px,auto] gap-3" onSubmit={onSubmitSearch}>
        <div className="relative">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => onChangeStatusFilter(event.target.value)}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BANNED">Banned</option>
        </select>
        <select
          value={accountTypeFilter}
          onChange={(event) => onChangeAccountTypeFilter(event.target.value)}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <option value="all">All Account Types</option>
          <option value="USER">Customer (User)</option>
          <option value="SELLER">Seller</option>
          {isSuperAdmin && <option value="ADMIN">Administrator</option>}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 text-white text-sm font-bold px-5 hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
        >
          Search
        </button>
      </form>

      <div className="mt-5 border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        {loading || loadingRoles ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading data...</span>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-sm font-semibold text-slate-600">No users found.</p>
            <p className="text-xs text-slate-400">Try changing filters or search keywords.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[1080px]">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold w-1/4">User</th>
                <th className="px-4 py-3 text-left font-bold w-[15%]">Account Type</th>
                <th className="px-4 py-3 text-left font-bold w-1/4">Roles</th>
                <th className="px-4 py-3 text-left font-bold w-[12%]">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((userItem) => {
                const canManageThisUser = canManageTargetUser(userItem);
                const roleNames = roleNamesForUser(userItem);
                const status = getStatus(userItem);
                const isProcessing = processingUserIds.includes(userItem._id);
                const isInactive = status === "INACTIVE";
                const isLocked = status === "BANNED";

                let StatusBadge;
                if (status === "ACTIVE") {
                  StatusBadge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>;
                } else if (isLocked) {
                  StatusBadge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Locked</span>;
                } else if (isInactive) {
                  StatusBadge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inactive</span>;
                } else {
                  StatusBadge = <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>{status}</span>;
                }

                return (
                  <tr key={userItem._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={userItem.profile?.avatar_url || `https://ui-avatars.com/api/?name=${userItem.email || 'U'}&background=e2e8f0&color=475569&rounded=true&bold=true`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-slate-900 font-bold tracking-tight truncate">{getDisplayName(userItem)}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{userItem.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {userItem._accountType === 'USER' ? 'CUSTOMER' : userItem._accountType === 'SELLER' ? 'SELLER' : userItem._accountType === 'ADMIN' ? 'ADMINISTRATOR' : userItem._accountType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {roleNames.length > 0 ? roleNames.map((name) => (
                          <span
                            key={`${userItem._id}-${name}`}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {name}
                          </span>
                        )) : (
                          <span className="text-xs italic text-slate-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {StatusBadge}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openAssignRoleModal(userItem)}
                          disabled={!canManageThisUser || isProcessing}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-30 tooltip"
                          title="Assign Roles"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleLockUser(userItem)}
                          disabled={!canManageThisUser || isProcessing || isInactive}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isLocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                          title={isLocked ? "Unlock" : "Lock Account"}
                        >
                          {isLocked ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSoftDeleteUser(userItem)}
                          disabled={!canManageThisUser || isProcessing}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-30"
                          title="Soft Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
          Total: <span className="font-bold text-slate-700">{total}</span> accounts
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-600 font-semibold px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {
        selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Assign Permissions</h3>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium">
                    {getDisplayName(selectedUser)} - {selectedUser.email || "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Account Type:{" "}
                    <span className="font-bold text-slate-700 uppercase">
                      {selectedAccountType === 'USER' ? 'CUSTOMER' : selectedAccountType === 'SELLER' ? 'SELLER' : selectedAccountType === 'ADMIN' ? 'ADMINISTRATOR' : selectedAccountType}
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

              {!loadingAssignContext && selectedUser && (
                <div className="flex px-5 pt-3 border-b border-slate-100 bg-slate-50/50 shrink-0 gap-6">
                  {(showGlobalRoleEditor || showStoreRoleEditor) && (
                    <button
                      onClick={() => setActiveModalTab("roles")}
                      className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${activeModalTab === "roles"
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      Assign Roles
                    </button>
                  )}
                  <button
                    onClick={() => setActiveModalTab("direct")}
                    className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${activeModalTab === "direct"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Direct Permissions
                  </button>
                  <button
                    onClick={() => setActiveModalTab("summary")}
                    className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${activeModalTab === "summary"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Permissions Summary
                  </button>
                </div>
              )}

              <div className="px-5 py-4 overflow-y-auto stylish-scrollbar flex-1 min-h-[300px]">
                <div className="space-y-4">
                  {loadingAssignContext ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading permission info...</p>
                    </div>
                  ) : (
                    <>
                      {activeModalTab === "roles" && (
                        <>
                          {showGlobalRoleEditor && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Global Roles</h4>
                              <p className="text-xs text-slate-500 mb-3">
                                Apply to administration or general user accounts.
                              </p>
                              <div className="max-h-[260px] overflow-y-auto space-y-2.5 pr-1 stylish-scrollbar">
                                {globalAssignableRoles.length === 0 ? (
                                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-500 font-medium">No roles available for assignment.</p>
                                  </div>
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
                                              {permissions.slice(0, 5).map((p) => {
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
                                              {permissions.length > 5 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                                  +{permissions.length - 5} more
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-slate-400 font-medium italic mt-1">No permissions</p>
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
                            <div className={`${showGlobalRoleEditor ? "border-t border-slate-200 pt-5 mt-5" : ""}`}>
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Shop Roles (Seller)</h4>
                              <p className="text-xs text-slate-500 mb-3">
                                Select a shop and assign specific permissions for shop management functions.
                              </p>

                              <div className="mb-4">
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
                                  className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                  <option value="">-- Select Shop --</option>
                                  {stores.map((store) => (
                                    <option key={store._id} value={store._id}>
                                      {store.name || store.slug}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="max-h-[260px] overflow-y-auto space-y-2.5 pr-1 stylish-scrollbar">
                                {storeAssignableRoles.length === 0 ? (
                                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-500 font-medium">No shop roles established.</p>
                                  </div>
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
                                              {permissions.slice(0, 5).map((p) => {
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
                                              {permissions.length > 5 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                                  +{permissions.length - 5} more
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-slate-400 font-medium italic mt-1">No permissions</p>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeModalTab === "direct" && (
                        <div className="pt-2">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">
                            Direct Permissions
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Override with ALLOW or DENY a specific permission for this account.
                          </p>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr,140px] gap-3">
                            <select
                              value={selectedDirectPermissionId}
                              onChange={(event) => setSelectedDirectPermissionId(event.target.value)}
                              className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                              disabled={loadingAssignContext || loadingPermissionCatalog}
                            >
                              <option value="">
                                {loadingPermissionCatalog
                                  ? "Loading permissions..."
                                  : "-- Select Specific Permission --"}
                              </option>
                              {permissionCatalog.map((permission) => (
                                <option key={permission._id} value={permission._id}>
                                  [{permission.module}] {permission.name || permission.code}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedDirectEffect}
                              onChange={(event) => setSelectedDirectEffect(normalizeDirectEffect(event.target.value))}
                              className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                              disabled={loadingAssignContext}
                            >
                              <option value="ALLOW">ALLOW</option>
                              <option value="DENY">DENY</option>
                            </select>
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3">
                            <input
                              value={directPermissionNote}
                              onChange={(event) => setDirectPermissionNote(event.target.value)}
                              placeholder="Note (optional)"
                              className="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                              className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition-all shadow-sm"
                            >
                              {savingDirectPermission ? "Saving..." : "Apply Permission"}
                            </button>
                          </div>

                          <div className="mt-4 max-h-[180px] overflow-y-auto space-y-2.5 pr-1 stylish-scrollbar">
                            {userDirectPermissions.length === 0 ? (
                              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-sm text-slate-500 font-medium">No direct permission overrides.</p>
                              </div>
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
                                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors"
                                    >
                                      {isRemoving ? "Removing..." : "Remove"}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {activeModalTab === "summary" && (
                        <div className="pt-2">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Current Permissions Summary</h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Actual permissions the account currently holds from roles and direct overrides.
                          </p>
                          <div className="max-h-[180px] overflow-y-auto stylish-scrollbar">
                            {effectivePermissionCodesForSelectedUser.length === 0 ? (
                              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-sm text-slate-500 font-medium">This account has no permissions.</p>
                              </div>
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
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-end gap-3 rounded-b-2xl shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition-colors shadow-sm"
                >
                  Close
                </button>
                {showGlobalRoleEditor && (
                  <button
                    type="button"
                    onClick={onSaveUserRoles}
                    disabled={savingRoles || loadingAssignContext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm"
                  >
                    {savingRoles ? "Saving..." : "Save Global Roles"}
                  </button>
                )}
                {showStoreRoleEditor && (
                  <button
                    type="button"
                    onClick={onSaveStoreRoles}
                    disabled={savingStoreRoles || loadingAssignContext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm"
                  >
                    {savingStoreRoles ? "Saving..." : "Save Shop Roles"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </section >
  );
};

export default AdminUsersPage;
