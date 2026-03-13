import React, { useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const getPermissionId = (permission) =>
  typeof permission === "string" ? permission : permission?._id;

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const normalizeModule = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const AdminPermissionsPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);
  const [creatingPermission, setCreatingPermission] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [permissionForm, setPermissionForm] = useState({
    name: "",
    code: "",
    module: "",
    description: "",
  });

  const roleById = useMemo(
    () => new Map(roles.map((role) => [String(role._id), role])),
    [roles]
  );

  const selectedRole = useMemo(
    () => roleById.get(String(selectedRoleId)) || null,
    [roleById, selectedRoleId]
  );

  const groupedPermissions = useMemo(() => {
    const map = new Map();
    permissions.forEach((permission) => {
      const key = String(permission.module || "UNKNOWN").toUpperCase();
      const current = map.get(key) || [];
      current.push(permission);
      map.set(key, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const loadPageData = async (preferredRoleId = "") => {
    setLoading(true);
    setError("");
    try {
      const [permissionsRes, rolesRes] = await Promise.all([
        adminOverviewService.getPermissions({ page: 1, limit: 500, sortBy: "module", order: "asc" }),
        adminOverviewService.getRoles({ page: 1, limit: 200, includeDeleted: false, sortBy: "name", order: "asc" }),
      ]);

      const nextPermissions = Array.isArray(permissionsRes) ? permissionsRes : [];
      const nextRoles = Array.isArray(rolesRes)
        ? rolesRes.filter((role) => !role.deleted_at)
        : [];

      setPermissions(nextPermissions);
      setRoles(nextRoles);

      if (nextRoles.length === 0) {
        setSelectedRoleId("");
        setSelectedPermissionIds([]);
        return;
      }

      const roleIdToUse =
        preferredRoleId && nextRoles.some((role) => role._id === preferredRoleId)
          ? preferredRoleId
          : selectedRoleId && nextRoles.some((role) => role._id === selectedRoleId)
            ? selectedRoleId
            : nextRoles[0]._id;

      setSelectedRoleId(roleIdToUse);
      const nextSelectedRole = nextRoles.find((role) => role._id === roleIdToUse);
      const rolePermissionIds = Array.isArray(nextSelectedRole?.permission_ids)
        ? nextSelectedRole.permission_ids.map(getPermissionId).filter(Boolean)
        : [];
      setSelectedPermissionIds(rolePermissionIds);
    } catch (nextError) {
      setError(nextError.message || "Unable to load permissions and roles.");
      setPermissions([]);
      setRoles([]);
      setSelectedPermissionIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    const rolePermissionIds = Array.isArray(selectedRole.permission_ids)
      ? selectedRole.permission_ids.map(getPermissionId).filter(Boolean)
      : [];
    setSelectedPermissionIds(rolePermissionIds);
  }, [selectedRoleId, selectedRole]);

  const togglePermissionId = (permissionId) => {
    setSelectedPermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      }
      return [...prev, permissionId];
    });
  };

  const onCreatePermission = async (event) => {
    event.preventDefault();

    const name = permissionForm.name.trim();
    const code = normalizeCode(permissionForm.code);
    const module = normalizeModule(permissionForm.module || code.split(".")[0]);

    if (!name || !code || !module) {
      setError("Please enter name, code, and module.");
      return;
    }

    setCreatingPermission(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.createPermission({
        name,
        code,
        module,
        description: permissionForm.description.trim(),
      });
      setPermissionForm({ name: "", code: "", module: "", description: "" });
      setSuccess("Permission created successfully.");
      await loadPageData(selectedRoleId);
    } catch (nextError) {
      setError(nextError.message || "Failed to create permission.");
    } finally {
      setCreatingPermission(false);
    }
  };

  const onSaveRolePermissions = async () => {
    if (!selectedRoleId) {
      setError("Please select a role to update permissions.");
      return;
    }
    if (selectedPermissionIds.length === 0) {
      setError("A role must have at least 1 permission.");
      return;
    }

    setSavingRolePermissions(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.replaceRolePermissions(selectedRoleId, selectedPermissionIds);
      setSuccess("Role permissions updated successfully.");
      await loadPageData(selectedRoleId);
    } catch (nextError) {
      setError(nextError.message || "Failed to update role permissions.");
    } finally {
      setSavingRolePermissions(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Permission Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create new permissions and assign them to roles.
        </p>

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

        <form
          className="mt-4 grid grid-cols-1 lg:grid-cols-[220px,220px,180px,1fr,140px] gap-2.5"
          onSubmit={onCreatePermission}
        >
          <input
            value={permissionForm.name}
            onChange={(event) =>
              setPermissionForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Permission name"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            value={permissionForm.code}
            onChange={(event) =>
              setPermissionForm((prev) => ({ ...prev, code: event.target.value }))
            }
            placeholder="USER.CREATE"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div className="w-full">
            <input
              list="existing-modules"
              value={permissionForm.module}
              onChange={(event) =>
                setPermissionForm((prev) => ({ ...prev, module: event.target.value }))
              }
              placeholder="USER"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <datalist id="existing-modules">
              {groupedPermissions.map(([moduleName]) => (
                <option key={moduleName} value={moduleName} />
              ))}
            </datalist>
          </div>
          <input
            value={permissionForm.description}
            onChange={(event) =>
              setPermissionForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Description"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={creatingPermission}
            className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {creatingPermission ? "Creating..." : "Create permission"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Assign permissions to role</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a role, choose permissions, then save.
            </p>
          </div>
          <div className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
            {selectedPermissionIds.length} permissions selected
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="min-w-[260px] border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">Select role...</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name} ({role.scope})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onSaveRolePermissions}
            disabled={savingRolePermissions || !selectedRoleId}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {savingRolePermissions ? "Saving..." : "Save role permissions"}
          </button>
        </div>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">Loading permissions...</div>
          ) : groupedPermissions.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">No permissions available.</div>
          ) : (
            <div className="p-4 space-y-4">
              {groupedPermissions.map(([moduleName, items]) => (
                <section key={moduleName} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{moduleName}</h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {items.map((permission) => {
                      const checked = selectedPermissionIds.includes(permission._id);
                      return (
                        <label
                          key={permission._id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${checked
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermissionId(permission._id)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {permission.code}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{permission.name}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPermissionsPage;
