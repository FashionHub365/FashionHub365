import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";
import { confirmAction, showSuccess } from "../../../utils/swalUtils";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const getDisplayName = (user) =>
  user?.profile?.full_name || user?.username || user?.email || "-";

const getStatus = (user) => {
  const raw = user?.status || user?.account_status || "";
  if (raw) return String(raw).toUpperCase();
  if (typeof user?.is_active === "boolean") {
    return user.is_active ? "ACTIVE" : "INACTIVE";
  }
  return "UNKNOWN";
};

const getStatusClasses = (status) => {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  if (status === "BANNED") return "bg-rose-50 text-rose-700";
  if (status === "INACTIVE") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
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

const AdminSupportPage = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({
    pendingTotal: 0,
    bannedTotal: 0,
    logsTotal: 0,
  });

  const [processingUserIds, setProcessingUserIds] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, logsRes, pendingRes, bannedRes] = await Promise.all([
        adminOverviewService.getUsers({
          page,
          limit,
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy: "created_at",
          order: "desc",
        }),
        adminOverviewService.getAuditLogs({
          page: 1,
          limit: 8,
          search: "USER",
          sortBy: "created_at",
          order: "desc",
        }),
        adminOverviewService.getUsers({ page: 1, limit: 1, status: "PENDING" }),
        adminOverviewService.getUsers({ page: 1, limit: 1, status: "BANNED" }),
      ]);

      const nextUsers = Array.isArray(usersRes?.users) ? usersRes.users : [];
      const parsedMeta = parseMeta(usersRes?.meta, page, limit, nextUsers.length);
      setUsers(nextUsers);
      setPage(parsedMeta.page);
      setLimit(parsedMeta.limit);
      setTotal(parsedMeta.total);

      const nextLogs = Array.isArray(logsRes?.auditLogs) ? logsRes.auditLogs : [];
      setAuditLogs(nextLogs);

      const pendingMeta = parseMeta(pendingRes?.meta, 1, 1, 0);
      const bannedMeta = parseMeta(bannedRes?.meta, 1, 1, 0);
      const logsMeta = parseMeta(logsRes?.meta, 1, 8, nextLogs.length);
      setSummary({
        pendingTotal: pendingMeta.total,
        bannedTotal: bannedMeta.total,
        logsTotal: logsMeta.total,
      });
    } catch (nextError) {
      setError(nextError.message || "Unable to load support data.");
      setUsers([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = useMemo(() => {
    const safeLimit = Math.max(limit, 1);
    return Math.max(Math.ceil(total / safeLimit), 1);
  }, [limit, total]);

  const runUserAction = async (userId, action) => {
    setProcessingUserIds((prev) => Array.from(new Set([...prev, userId])));
    setError("");
    setSuccess("");
    try {
      await action();
      await loadData();
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
      ? "Bạn có chắc chắn muốn mở khóa tài khoản này không?"
      : "Bạn có chắc chắn muốn khóa tài khoản này không?";

    const isConfirmed = await confirmAction({
      title: isLocked ? "Mở khóa" : "Khóa tài khoản",
      text: confirmMessage,
      icon: isLocked ? "info" : "warning"
    });
    if (!isConfirmed) return;

    runUserAction(userItem._id, async () => {
      await adminOverviewService.updateUserStatus(
        userItem._id,
        nextStatus,
        isLocked ? "Unlocked by support" : "Locked by support"
      );
      showSuccess(isLocked ? "Đã mở khóa tài khoản thành công." : "Đã khóa tài khoản thành công.");
    });
  };

  const onDisableUser = async (userItem) => {
    if (!userItem?._id) return;
    const isConfirmed = await confirmAction({
      title: "Vô hiệu hóa tài khoản",
      text: "Bạn có chắc chắn muốn tạm dừng hoạt động của tài khoản này không?",
      icon: "warning"
    });
    if (!isConfirmed) return;

    runUserAction(userItem._id, async () => {
      await adminOverviewService.deleteUser(userItem._id);
      showSuccess("Tài khoản đã được chuyển sang trạng thái NGỪNG HOẠT ĐỘNG.");
    });
  };

  const onSubmitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <section className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Support center</h1>
        <p className="text-sm text-slate-500 mt-1">Handle account-related issues in one place.</p>

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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending users</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(summary.pendingTotal || 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Banned users</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(summary.bannedTotal || 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">User related logs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(summary.logsTotal || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-slate-900">User incidents</h2>
          <span className="text-sm text-slate-500">
            Total results: {Number(total || 0).toLocaleString("en-US")}
          </span>
        </div>

        <form
          className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,180px,120px] gap-2.5"
          onSubmit={onSubmitSearch}
        >
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
            <option value="PENDING">PENDING</option>
            <option value="BANNED">BANNED</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="ACTIVE">ACTIVE</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">User</th>
                <th className="px-3 py-2.5 text-left">Email</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-left">Roles</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    Loading data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    No users match current filters.
                  </td>
                </tr>
              ) : (
                users.map((userItem) => {
                  const status = getStatus(userItem);
                  const isLocked = status === "BANNED";
                  const isProcessing = processingUserIds.includes(userItem._id);
                  const roles = Array.isArray(userItem.global_role_ids)
                    ? userItem.global_role_ids.map((role) => role?.slug || role?.name).filter(Boolean)
                    : [];

                  return (
                    <tr key={userItem._id} className="border-t border-slate-100">
                      <td className="px-3 py-3 text-slate-900 font-medium">{getDisplayName(userItem)}</td>
                      <td className="px-3 py-3 text-slate-700">{userItem.email || "-"}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusClasses(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {roles.length > 0 ? roles.join(", ") : "-"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleLockUser(userItem)}
                            disabled={isProcessing || status === "INACTIVE"}
                            className="px-3 py-1.5 rounded-md border border-amber-300 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            {isLocked ? "Unlock" : "Lock"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDisableUser(userItem)}
                            disabled={isProcessing || status === "INACTIVE"}
                            className="px-3 py-1.5 rounded-md border border-rose-300 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Soft delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
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

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Recent support logs</h2>
        <p className="text-sm text-slate-500 mt-1">History of actions and changes related to users.</p>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">Time</th>
                <th className="px-3 py-2.5 text-left">Action</th>
                <th className="px-3 py-2.5 text-left">Actor</th>
                <th className="px-3 py-2.5 text-left">Target</th>
                <th className="px-3 py-2.5 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    Loading data...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    No matching logs.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-slate-700">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2.5 text-slate-800 font-medium">{log.action || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {log?.user_id?.profile?.full_name ||
                        log?.user_id?.username ||
                        log?.user_id?.email ||
                        "-"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {log.target_collection || "-"} / {log.target_id || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{log.ip_address || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminSupportPage;
