import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { adminOverviewService } from "../services/adminOverviewService";

const STORAGE_KEY = "admin_user_groups_v1";

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const emptyGroup = {
  id: "",
  name: "",
  slug: "",
  description: "",
  status: "ACTIVE",
  roleIds: [],
  memberIds: [],
  history: [],
  createdAt: null,
  updatedAt: null,
};

const parseStoredGroups = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveStoredGroups = (groups) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const extractRawRoleSlugs = (user) => {
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

const AdminUserGroupsPage = () => {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [allRoles, setAllRoles] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [allKnownUsers, setAllKnownUsers] = useState([]);
  const [memberKeyword, setMemberKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentRawRoles = useMemo(
    () => extractRawRoleSlugs(currentUser),
    [currentUser]
  );
  const canManageUserGroups =
    currentRawRoles.includes("super-admin") || currentRawRoles.includes("admin");

  const userMap = useMemo(
    () => new Map(allKnownUsers.map((user) => [user._id, user])),
    [allKnownUsers]
  );

  const activeGroups = useMemo(
    () => groups.filter((group) => !group.deletedAt),
    [groups]
  );

  const selectedMembers = useMemo(
    () =>
      (groupForm.memberIds || [])
        .map((userId) => userMap.get(userId))
        .filter(Boolean),
    [groupForm.memberIds, userMap]
  );

  const upsertKnownUsers = useCallback((items) => {
    setAllKnownUsers((prev) => {
      const map = new Map(prev.map((user) => [user._id, user]));
      items.forEach((user) => {
        if (user?._id) map.set(user._id, user);
      });
      return Array.from(map.values());
    });
  }, []);

  const appendHistory = useCallback((baseGroup, action, details = {}) => {
    const now = new Date().toISOString();
    const nextHistory = Array.isArray(baseGroup.history)
      ? [...baseGroup.history]
      : [];
    nextHistory.unshift({
      id: createId(),
      action,
      details,
      at: now,
    });
    return {
      ...baseGroup,
      history: nextHistory.slice(0, 100),
      updatedAt: now,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    if (!canManageUserGroups) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [rolesRes, usersRes] = await Promise.all([
        adminOverviewService.getRoles({ page: 1, limit: 200, includeDeleted: false }),
        adminOverviewService.getUsers({ page: 1, limit: 100 }),
      ]);

      const globalRoles = Array.isArray(rolesRes)
        ? rolesRes.filter((role) => String(role?.scope || "GLOBAL").toUpperCase() === "GLOBAL")
        : [];
      setAllRoles(globalRoles);
      upsertKnownUsers(Array.isArray(usersRes?.users) ? usersRes.users : []);

      const stored = parseStoredGroups();
      setGroups(stored);

      const first = stored.find((item) => !item.deletedAt) || null;
      if (first) {
        setSelectedGroupId(first.id);
        setGroupForm(first);
      } else {
        setSelectedGroupId("");
        setGroupForm(emptyGroup);
      }
    } catch (nextError) {
      setError(nextError.message || "Unable to load user group data.");
    } finally {
      setLoading(false);
    }
  }, [upsertKnownUsers, canManageUserGroups]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const updateGroups = useCallback((nextGroups, nextSelectedId = selectedGroupId) => {
    setGroups(nextGroups);
    saveStoredGroups(nextGroups);

    const selected = nextGroups.find((item) => item.id === nextSelectedId && !item.deletedAt);
    if (selected) {
      setSelectedGroupId(selected.id);
      setGroupForm(selected);
      return;
    }

    const fallback = nextGroups.find((item) => !item.deletedAt) || null;
    if (fallback) {
      setSelectedGroupId(fallback.id);
      setGroupForm(fallback);
    } else {
      setSelectedGroupId("");
      setGroupForm(emptyGroup);
    }
  }, [selectedGroupId]);

  const onSelectGroup = (group) => {
    setSuccess("");
    setError("");
    setSelectedGroupId(group.id);
    setGroupForm(group);
  };

  const onCreateMode = () => {
    setSuccess("");
    setError("");
    setSelectedGroupId("");
    setGroupForm({
      ...emptyGroup,
      id: createId(),
    });
  };

  const onFormChange = (field, value) => {
    setGroupForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !selectedGroupId) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const toggleRole = (roleId) => {
    setGroupForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((item) => item !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const addMember = (userId) => {
    setGroupForm((prev) => {
      if (prev.memberIds.includes(userId)) return prev;
      return {
        ...prev,
        memberIds: [...prev.memberIds, userId],
      };
    });
  };

  const removeMember = (userId) => {
    setGroupForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => id !== userId),
    }));
  };

  const onSaveGroup = () => {
    setError("");
    setSuccess("");

    const name = groupForm.name.trim();
    const slug = groupForm.slug.trim();
    if (!name) {
      setError("Please enter the group name.");
      return;
    }
    if (!slug) {
      setError("Please enter the system code (slug).");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (!selectedGroupId) {
        const exists = groups.some(
          (item) => !item.deletedAt && item.slug.toLowerCase() === slug.toLowerCase()
        );
        if (exists) {
          setError("System code already exists. Please try another one.");
          return;
        }

        const created = appendHistory(
          {
            ...groupForm,
            id: groupForm.id || createId(),
            createdAt: now,
            updatedAt: now,
          },
          "CREATE_GROUP",
          { name, slug }
        );
        const nextGroups = [created, ...groups];
        updateGroups(nextGroups, created.id);
        setSuccess("Group created successfully.");
      } else {
        const exists = groups.some(
          (item) =>
            item.id !== selectedGroupId &&
            !item.deletedAt &&
            item.slug.toLowerCase() === slug.toLowerCase()
        );
        if (exists) {
          setError("System code already exists. Please try another one.");
          return;
        }

        const nextGroups = groups.map((item) => {
          if (item.id !== selectedGroupId) return item;
          const base = {
            ...item,
            ...groupForm,
            name,
            slug,
            updatedAt: now,
          };
          return appendHistory(base, "UPDATE_GROUP", {
            name,
            slug,
            status: base.status,
            roleCount: base.roleIds.length,
            memberCount: base.memberIds.length,
          });
        });
        updateGroups(nextGroups, selectedGroupId);
        setSuccess("Group information updated.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDeleteGroup = () => {
    if (!selectedGroupId) return;
    setError("");
    setSuccess("");

    const nextGroups = groups.map((item) => {
      if (item.id !== selectedGroupId) return item;
      return appendHistory(
        {
          ...item,
          deletedAt: new Date().toISOString(),
          status: "INACTIVE",
        },
        "DELETE_GROUP",
        { name: item.name, slug: item.slug }
      );
    });
    updateGroups(nextGroups, "");
    setSuccess("Group deleted.");
  };

  const onSearchMembers = async () => {
    setSearching(true);
    setError("");
    try {
      const result = await adminOverviewService.getUsers({
        page: 1,
        limit: 20,
        search: memberKeyword.trim(),
      });
      const users = Array.isArray(result?.users) ? result.users : [];
      setSearchUsers(users);
      upsertKnownUsers(users);
    } catch (nextError) {
      setError(nextError.message || "No users found.");
    } finally {
      setSearching(false);
    }
  };

  const applyRolesToMembers = async (mode = "replace") => {
    if (!selectedGroupId) {
      setError("No group selected.");
      return;
    }
    if (!groupForm.memberIds.length) {
      setError("This group has no members.");
      return;
    }
    if (!groupForm.roleIds.length) {
      setError("This group has no default roles assigned.");
      return;
    }

    setApplying(true);
    setError("");
    setSuccess("");

    try {
      let successCount = 0;
      for (const userId of groupForm.memberIds) {
        const currentUser = userMap.get(userId);
        const currentRoleIds = Array.isArray(currentUser?.global_role_ids)
          ? currentUser.global_role_ids.map((role) =>
            typeof role === "string" ? role : role?._id
          ).filter(Boolean)
          : [];

        const nextRoleIds =
          mode === "merge"
            ? Array.from(new Set([...currentRoleIds, ...groupForm.roleIds]))
            : groupForm.roleIds;

        await adminOverviewService.updateUser(userId, {
          global_role_ids: nextRoleIds,
        });
        successCount += 1;
      }

      const nextGroups = groups.map((item) => {
        if (item.id !== selectedGroupId) return item;
        return appendHistory(item, "APPLY_ROLES_TO_MEMBERS", {
          mode,
          successCount,
          roleCount: groupForm.roleIds.length,
        });
      });
      updateGroups(nextGroups, selectedGroupId);
      setSuccess(`Successfully applied permissions to ${successCount}/${groupForm.memberIds.length} members.`);
    } catch (nextError) {
      setError(nextError.message || "Error applying bulk permissions.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Loading data...</p>
        </div>
      </section>
    );
  }

  if (!canManageUserGroups) {
    return (
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">Manage User Groups</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-xl px-5 py-4 shadow-sm">
          This account does not have permission to manage user groups.
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-6">
      <aside className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">Group List</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
              {activeGroups.length} active groups
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateMode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition-all shadow-sm"
          >
            + Create New
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 stylish-scrollbar flex-1 min-h-0">
          {activeGroups.map((group) => {
            const isActive = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group)}
                className={`w-full text-left border rounded-2xl px-4 py-3.5 transition-all outline-none ${isActive
                  ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/60 shadow-sm"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{group.name}</p>
                  {group.status === "ACTIVE" ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" title="Active"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 mt-1 shrink-0" title="Inactive"></span>
                  )}
                </div>
                <p className={`text-[11px] mt-1 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{group.slug}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`px-2 py-1 rounded-md ${isActive ? 'bg-indigo-100/80 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {group.roleIds?.length || 0} roles
                  </span>
                  <span className={`px-2 py-1 rounded-md ${isActive ? 'bg-indigo-100/80 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {group.memberIds?.length || 0} members
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
        <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Group Details</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage general information, assign default roles, and manage group members.
            </p>
          </div>
          {groupForm.updatedAt && (
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Last updated: <span className="text-slate-800">{formatDateTime(groupForm.updatedAt)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-5 bg-rose-50 border border-rose-200/60 flex items-center gap-3 text-rose-700 text-sm font-semibold rounded-xl px-4 py-3 shadow-sm shrink-0">
            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mt-5 bg-emerald-50 flex items-center gap-3 border border-emerald-200/60 text-emerald-700 text-sm font-semibold rounded-xl px-4 py-3 shadow-sm shrink-0">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {success}
          </div>
        )}

        <div className="mt-6 overflow-y-auto stylish-scrollbar pr-2 pb-6 min-h-0 flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Group Name</label>
              <input
                value={groupForm.name}
                onChange={(event) => onFormChange("name", event.target.value)}
                placeholder="e.g. Support Team"
                className="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">System Code (Read-only)</label>
              <input
                value={groupForm.slug}
                readOnly
                placeholder="support-team"
                className="w-full pl-4 pr-3 py-3 bg-slate-100/50 border border-slate-200 text-slate-500 font-medium cursor-not-allowed rounded-xl text-sm focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium ml-1">Automatically generated based on group name</p>
            </div>
            <div className="xl:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Detailed Description</label>
              <textarea
                rows={3}
                value={groupForm.description}
                onChange={(event) => onFormChange("description", event.target.value)}
                placeholder="Description of permissions and scope of the group..."
                className="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Status</label>
              <select
                value={groupForm.status}
                onChange={(event) => onFormChange("status", event.target.value)}
                className="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <section className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Default Roles for Group</h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{groupForm.roleIds.length} roles selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {allRoles.map((role) => {
                const checked = groupForm.roleIds.includes(role._id);
                return (
                  <label
                    key={role._id}
                    className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${checked
                      ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                      : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(role._id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{role.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 break-words">{role.slug}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Group Members</h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{groupForm.memberIds.length} members</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  value={memberKeyword}
                  onChange={(event) => setMemberKeyword(event.target.value)}
                  placeholder="Search by name or email to add to group..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button
                type="button"
                onClick={onSearchMembers}
                disabled={searching}
                className="px-6 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all shadow-sm"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchUsers.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-3 mb-4 max-h-[220px] overflow-y-auto stylish-scrollbar bg-white">
                <div className="space-y-2">
                  {searchUsers.map((user) => {
                    const added = groupForm.memberIds.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {user?.profile?.full_name || user.username || user.email}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{user.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addMember(user._id)}
                          disabled={added}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${added
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                            }`}
                        >
                          {added ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[40%]">Member</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[40%]">Email</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedMembers.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-500 text-sm font-medium" colSpan={3}>
                        The group has no members.
                      </td>
                    </tr>
                  ) : (
                    selectedMembers.map((member) => (
                      <tr key={member._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">{member?.profile?.full_name || member.username || "-"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-600">{member.email}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeMember(member._id)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                          >
                            Remove from group
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Activity History</h3>
            <div className="border border-slate-200 rounded-xl max-h-[180px] overflow-y-auto stylish-scrollbar bg-slate-50">
              {(groupForm.history || []).length === 0 ? (
                <div className="px-4 py-5 text-sm font-semibold text-slate-500 text-center">No activity history.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {(groupForm.history || []).map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 bg-white"
                    >
                      <p className="text-sm font-bold text-slate-900">{item.action}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {formatDateTime(item.at)} <span className="mx-1">•</span> {JSON.stringify(item.details || {})}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="pt-5 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => applyRolesToMembers("replace")}
              disabled={applying}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all shadow-sm"
            >
              {applying ? "Running..." : "Apply Permissions (Replace)"}
            </button>
            <button
              type="button"
              onClick={() => applyRolesToMembers("merge")}
              disabled={applying}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all shadow-sm"
            >
              {applying ? "Running..." : "Apply Permissions (Merge)"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {selectedGroupId && (
              <button
                type="button"
                onClick={onDeleteGroup}
                className="px-5 py-2.5 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
              >
                Delete Group
              </button>
            )}
            <button
              type="button"
              onClick={onSaveGroup}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm"
            >
              {saving ? "Saving..." : selectedGroupId ? "Save Changes" : "Create New Group"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminUserGroupsPage;
