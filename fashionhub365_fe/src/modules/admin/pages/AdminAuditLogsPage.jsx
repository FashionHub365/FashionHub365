import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const parseMeta = (meta, fallbackPage, fallbackLimit, fallbackTotal) => {
  const page = Number(meta?.page || meta?.pagination?.page || fallbackPage || 1);
  const limit = Number(meta?.limit || meta?.pagination?.limit || fallbackLimit || 20);
  const total = Number(meta?.total || meta?.pagination?.total || fallbackTotal || 0);
  return {
    page: Number.isFinite(page) && page > 0 ? page : fallbackPage,
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallbackLimit,
    total: Number.isFinite(total) && total >= 0 ? total : fallbackTotal,
  };
};

const prettyJson = (value) => {
  if (value === undefined || value === null) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetCollection, setTargetCollection] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminOverviewService.getAuditLogs({
        page,
        limit,
        search: search.trim() || undefined,
        action: actionFilter.trim() || undefined,
        targetCollection: targetCollection !== "all" ? targetCollection : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy: "created_at",
        order: "desc",
      });

      const nextLogs = Array.isArray(result?.auditLogs) ? result.auditLogs : [];
      const parsedMeta = parseMeta(result?.meta, page, limit, nextLogs.length);
      setLogs(nextLogs);
      setPage(parsedMeta.page);
      setTotal(parsedMeta.total);
    } catch (nextError) {
      setError(nextError.message || "Unable to load audit logs.");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, fromDate, limit, page, search, targetCollection, toDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = useMemo(() => {
    const safeLimit = Math.max(limit, 1);
    return Math.max(Math.ceil(total / safeLimit), 1);
  }, [limit, total]);

  const onSubmitFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setActionFilter("");
    setTargetCollection("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const openLogDetail = async (logId) => {
    if (!logId) return;
    setDetailLoading(true);
    setDetailError("");
    setSelectedLog(null);
    try {
      const log = await adminOverviewService.getAuditLogById(logId);
      setSelectedLog(log);
    } catch (nextError) {
      setDetailError(nextError.message || "Unable to load audit log details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedLog(null);
    setDetailError("");
    setDetailLoading(false);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Audit logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track the full history of actions in the admin system.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form
        className="grid grid-cols-1 lg:grid-cols-[1fr,180px,180px,170px,170px,120px] gap-2.5"
        onSubmit={onSubmitFilters}
      >
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search action, collection, IP, user-agent..."
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <input
          value={actionFilter}
          onChange={(event) => {
            setPage(1);
            setActionFilter(event.target.value);
          }}
          placeholder="Action"
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <select
          value={targetCollection}
          onChange={(event) => {
            setPage(1);
            setTargetCollection(event.target.value);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">All collections</option>
          <option value="User">User</option>
          <option value="Role">Role</option>
          <option value="StoreMember">StoreMember</option>
          <option value="Session">Session</option>
          <option value="Order">Order</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => {
            setPage(1);
            setFromDate(event.target.value);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => {
            setPage(1);
            setToDate(event.target.value);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="text-slate-500">
          Total logs: <span className="font-semibold text-slate-700">{Number(total || 0).toLocaleString("en-US")}</span>
        </p>
        <button
          type="button"
          onClick={clearFilters}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2.5 text-left">Time</th>
              <th className="px-3 py-2.5 text-left">Action</th>
              <th className="px-3 py-2.5 text-left">Actor</th>
              <th className="px-3 py-2.5 text-left">Target</th>
              <th className="px-3 py-2.5 text-left">IP</th>
              <th className="px-3 py-2.5 text-left">User agent</th>
              <th className="px-3 py-2.5 text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={7}>
                  Loading data...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={7}>
                  No audit logs match current filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 text-slate-700">{formatDateTime(log.created_at)}</td>
                  <td className="px-3 py-2.5 text-slate-900 font-medium">{log.action || "-"}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {log?.user_id?.profile?.full_name ||
                      log?.user_id?.username ||
                      log?.user_id?.email ||
                      "-"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {log.target_collection || "-"} / {log.target_id || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{log.ip_address || "-"}</td>
                  <td className="px-3 py-2.5 text-slate-600 max-w-[260px] truncate" title={log.user_agent || "-"}>
                    {log.user_agent || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => openLogDetail(log._id)}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
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

      {(selectedLog || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">Audit log detail</h3>
              <button
                type="button"
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {detailLoading && <p className="text-sm text-slate-500">Loading details...</p>}
              {detailError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && selectedLog && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Action</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedLog.action || "-"}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Created at</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedLog.created_at)}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Actor</p>
                      <p className="mt-1 text-slate-800">
                        {selectedLog?.user_id?.profile?.full_name ||
                          selectedLog?.user_id?.username ||
                          selectedLog?.user_id?.email ||
                          "-"}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Target</p>
                      <p className="mt-1 text-slate-800">
                        {selectedLog.target_collection || "-"} / {selectedLog.target_id || "-"}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3 md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Network</p>
                      <p className="mt-1 text-slate-800">IP: {selectedLog.ip_address || "-"}</p>
                      <p className="text-slate-600 break-words">UA: {selectedLog.user_agent || "-"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">Old values</p>
                      <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 overflow-auto max-h-64">
                        {prettyJson(selectedLog.old_values)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">New values</p>
                      <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 overflow-auto max-h-64">
                        {prettyJson(selectedLog.new_values)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminAuditLogsPage;
