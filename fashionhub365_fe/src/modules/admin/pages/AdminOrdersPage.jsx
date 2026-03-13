import React, { useEffect, useMemo, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US");
};

const AdminOrdersPage = () => {
  const [stats, setStats] = useState(null);
  const [orderLogs, setOrderLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, logsRes] = await Promise.all([
          adminOverviewService.getSystemStats(),
          adminOverviewService.getAuditLogs({
            page: 1,
            limit: 8,
            targetCollection: "Order",
            sortBy: "created_at",
            order: "desc",
          }),
        ]);

        setStats(statsRes);
        setOrderLogs(Array.isArray(logsRes?.auditLogs) ? logsRes.auditLogs : []);
      } catch (nextError) {
        setError(nextError.message || "Unable to load order data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summary = stats?.summary || {};
  const ordersByStatus = useMemo(
    () => (Array.isArray(stats?.ordersByStatus) ? stats.ordersByStatus : []),
    [stats]
  );

  return (
    <section className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Order Management</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of order KPIs and status distribution.</p>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Number(summary.totalOrders || 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatMoney(summary.totalRevenue)} VND
            </p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Paid revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatMoney(summary.paidRevenue)} VND
            </p>
          </div>
        </div>

        <div className="mt-5 border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-900">Orders by status</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Loading data...</p>
          ) : ordersByStatus.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No analytics data yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {ordersByStatus.map((item) => (
                <div key={item._id || "UNKNOWN"} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <p className="text-xs text-slate-500 uppercase">{item._id || "UNKNOWN"}</p>
                  <p className="text-lg font-semibold text-slate-800 mt-0.5">{item.count || 0}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Order-related audit logs</h2>
        <p className="text-sm text-slate-500 mt-1">History of updates and actions related to orders.</p>

        <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">Time</th>
                <th className="px-3 py-2.5 text-left">Action</th>
                <th className="px-3 py-2.5 text-left">Actor</th>
                <th className="px-3 py-2.5 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={4}>
                    Loading data...
                  </td>
                </tr>
              ) : orderLogs.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={4}>
                    No order logs yet.
                  </td>
                </tr>
              ) : (
                orderLogs.map((log) => (
                  <tr key={log._id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-slate-700">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2.5 text-slate-800 font-medium">{log.action || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {log?.user_id?.profile?.full_name || log?.user_id?.username || log?.user_id?.email || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{log.target_id || "-"}</td>
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

export default AdminOrdersPage;
