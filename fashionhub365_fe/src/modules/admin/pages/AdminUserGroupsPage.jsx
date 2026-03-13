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
      setError(nextError.message || "Unable to load role group data.");
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
      setError("Role group name is required.");
      return;
    }
    if (!slug) {
      setError("Role group slug is required.");
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
          setError("Slug already exists. Please choose another one.");
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
        setSuccess("Role group created.");
      } else {
        const exists = groups.some(
          (item) =>
            item.id !== selectedGroupId &&
            !item.deletedAt &&
            item.slug.toLowerCase() === slug.toLowerCase()
        );
        if (exists) {
          setError("Slug already exists. Please choose another one.");
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
        setSuccess("Role group updated.");
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
    setSuccess("Role group soft-deleted.");
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
      setError(nextError.message || "Unable to find users.");
    } finally {
      setSearching(false);
    }
  };

  const applyRolesToMembers = async (mode = "replace") => {
    if (!selectedGroupId) {
      setError("No role group selected.");
      return;
    }
    if (!groupForm.memberIds.length) {
      setError("This group has no members to apply roles to.");
      return;
    }
    if (!groupForm.roleIds.length) {
      setError("This group has no default roles.");
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
      setSuccess(`Applied roles to ${successCount}/${groupForm.memberIds.length} members successfully.`);
    } catch (nextError) {
      setError(nextError.message || "Bulk role application failed.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      </section>
    );
  }

  if (!canManageUserGroups) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Role Groups</h1>
        <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2">
          This account cannot manage role groups.
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-5">
      <aside className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Role Groups</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeGroups.length} active groups
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateMode}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            + Create
          </button>
        </div>

        <div className="space-y-2 max-h-[740px] overflow-y-auto pr-1">
          {activeGroups.map((group) => {
            const isActive = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group)}
                className={`w-full text-left border rounded-xl px-3 py-2.5 transition-colors ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{group.slug}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {group.roleIds?.length || 0} roles
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {group.memberIds?.length || 0} members
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Role Group Details</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create groups, assign default roles, add members, and apply roles in bulk.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Updated at:{" "}
            <span className="font-semibold text-slate-700">
              {formatDateTime(groupForm.updatedAt)}
            </span>
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

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Group name</label>
            <input
              value={groupForm.name}
              onChange={(event) => onFormChange("name", event.target.value)}
              placeholder="Example: CS Team"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Slug</label>
            <input
              value={groupForm.slug}
              onChange={(event) => onFormChange("slug", slugify(event.target.value))}
              placeholder="cs-team"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={groupForm.description}
              onChange={(event) => onFormChange("description", event.target.value)}
              placeholder="Describe the group responsibility scope..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select
              value={groupForm.status}
              onChange={(event) => onFormChange("status", event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Default roles for group</h3>
            <span className="text-xs text-slate-500">{groupForm.roleIds.length} roles selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {allRoles.map((role) => {
              const checked = groupForm.roleIds.includes(role._id);
              return (
                <label
                  key={role._id}
                  className={`flex items-center gap-2.5 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                    checked ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role._id)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-slate-800">{role.name}</p>
                    <p className="text-[11px] text-slate-500">{role.slug}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Group members</h3>
            <span className="text-xs text-slate-500">{groupForm.memberIds.length} members</span>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={memberKeyword}
              onChange={(event) => setMemberKeyword(event.target.value)}
              placeholder="Search users by email/name to add to group..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={onSearchMembers}
              disabled={searching}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {searchUsers.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-2.5 mb-3 max-h-44 overflow-y-auto">
              {searchUsers.map((user) => {
                const added = groupForm.memberIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {user?.profile?.full_name || user.username || user.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addMember(user._id)}
                      disabled={added}
                      className="px-3 py-1 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Member</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedMembers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={3}>
                      No members in this group yet.
                    </td>
                  </tr>
                ) : (
                  selectedMembers.map((member) => (
                    <tr key={member._id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 text-slate-800">
                        {member?.profile?.full_name || member.username || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{member.email}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeMember(member._id)}
                          className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
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

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyRolesToMembers("replace")}
              disabled={applying}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {applying ? "Running..." : "Apply roles to members (Replace)"}
            </button>
            <button
              type="button"
              onClick={() => applyRolesToMembers("merge")}
              disabled={applying}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {applying ? "Running..." : "Apply roles to members (Merge)"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedGroupId && (
              <button
                type="button"
                onClick={onDeleteGroup}
                className="px-3 py-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Delete group
              </button>
            )}
            <button
              type="button"
              onClick={onSaveGroup}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : selectedGroupId ? "Save updates" : "Create group"}
            </button>
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Action history</h3>
          <div className="border border-slate-200 rounded-lg max-h-52 overflow-y-auto">
            {(groupForm.history || []).length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500">No action history yet.</div>
            ) : (
              (groupForm.history || []).map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2.5 border-t first:border-t-0 border-slate-100"
                >
                  <p className="text-sm font-medium text-slate-800">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTime(item.at)} • {JSON.stringify(item.details || {})}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default AdminUserGroupsPage;
