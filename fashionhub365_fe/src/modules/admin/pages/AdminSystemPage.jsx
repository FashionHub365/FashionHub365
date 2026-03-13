import React, { useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const AdminSystemPage = () => {
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState({
    globalPermissions: [],
    effectivePermissions: [],
    stores: [],
  });
  const [sessions, setSessions] = useState([]);
  const [enums, setEnums] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, permsRes, sessionsRes, enumsRes] = await Promise.all([
        adminOverviewService.getAdminProfile(),
        adminOverviewService.getAdminPermissions(),
        adminOverviewService.getAdminSessions(),
        adminOverviewService.getAdminEnums(),
      ]);
      setProfile(profileRes);
      setPermissions(permsRes);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
      setEnums(enumsRes || {});
    } catch (nextError) {
      setError(nextError.message || "Unable to load system data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSessions = useMemo(
    () => sessions.filter((session) => session.is_current),
    [sessions]
  );

  const revokeSession = async (sessionId) => {
    if (!window.confirm("Revoke this session?")) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.revokeAdminSession(sessionId);
      setSuccess("Session revoked successfully.");
      await loadData();
    } catch (nextError) {
      setError(nextError.message || "Failed to revoke session.");
    } finally {
      setProcessing(false);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm("Log out from all sessions?")) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.logoutAllAdminSessions();
      setSuccess("Logged out from all sessions.");
      await loadData();
    } catch (nextError) {
      setError(nextError.message || "Unable to log out all sessions.");
    } finally {
      setProcessing(false);
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await adminOverviewService.changeAdminPassword(
        passwordForm.oldPassword,
        passwordForm.newPassword
      );
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed successfully.");
      await loadData();
    } catch (nextError) {
      setError(nextError.message || "Failed to change password.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage admin account information and security settings.
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

        {loading ? (
          <div className="mt-4 text-sm text-slate-500">Loading data...</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Current admin</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.profile?.full_name || profile?.username || "-"}
              </p>
              <p className="text-xs text-slate-500 mt-1">{profile?.email || "-"}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Global permissions</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {permissions.globalPermissions.length}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Effective permissions</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {permissions.effectivePermissions.length}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Change admin password</h2>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5"
          onSubmit={onChangePassword}
        >
          <input
            type="password"
            value={passwordForm.oldPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))
            }
            placeholder="Current password"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
            placeholder="New password"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            placeholder="Confirm new password"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {processing ? "Processing..." : "Update password"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Session Management</h2>
          <button
            type="button"
            onClick={logoutAll}
            disabled={processing}
            className="px-3 py-1.5 rounded-md border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-50"
          >
            Logout all
          </button>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Current sessions: {currentSessions.length} / Total sessions: {sessions.length}
        </p>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">IP</th>
                <th className="px-3 py-2.5 text-left">User agent</th>
                <th className="px-3 py-2.5 text-left">Created</th>
                <th className="px-3 py-2.5 text-left">Expires</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={6}>
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-slate-700">{session.ip_address || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[320px] truncate">{session.user_agent || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-700">{formatDateTime(session.created_at)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{formatDateTime(session.expires_at)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          session.is_revoked
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {session.is_current
                          ? "CURRENT"
                          : session.is_revoked
                            ? "REVOKED"
                            : "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {!session.is_current && !session.is_revoked && (
                        <button
                          type="button"
                          onClick={() => revokeSession(session.id)}
                          disabled={processing}
                          className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">System enums</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">User statuses</p>
            <p className="text-sm text-slate-700 mt-1">
              {(enums.userStatuses || []).join(", ") || "-"}
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role scopes</p>
            <p className="text-sm text-slate-700 mt-1">
              {(enums.roleScopes || []).join(", ") || "-"}
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Store member statuses</p>
            <p className="text-sm text-slate-700 mt-1">
              {(enums.storeMemberStatuses || []).join(", ") || "-"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminSystemPage;
