import React, { useEffect, useState } from "react";
import { adminOverviewService } from "../services/adminOverviewService";

const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await adminOverviewService.getSystemStats();
        setStats(data);
      } catch (err) {
        setError(err.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const monthlyStats = stats?.monthlyStats || [];
  const monthlyUsers = stats?.monthlyUsers || [];
  const ordersByStatus = stats?.ordersByStatus || [];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-slate-900">Reports & Analytics</h2>
      <p className="text-sm text-slate-500 mt-1">Overview of key operational metrics.</p>

      {error && (
        <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-900">Orders by status</p>
            <div className="mt-2 space-y-1.5">
              {ordersByStatus.map((item) => (
                <div key={item._id} className="text-sm flex items-center justify-between">
                  <span className="text-slate-600 capitalize">{item._id || "unknown"}</span>
                  <span className="font-semibold text-slate-800">{item.count}</span>
                </div>
              ))}
              {ordersByStatus.length === 0 && <p className="text-sm text-slate-500">No data available.</p>}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-900">Monthly revenue and orders</p>
            <div className="mt-2 space-y-1.5">
              {monthlyStats.slice(-8).map((item) => (
                <div key={`${item._id?.year}-${item._id?.month}`} className="text-sm">
                  <p className="text-slate-700">
                    {String(item._id?.month || "").padStart(2, "0")}/{item._id?.year}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Number(item.revenue || 0).toLocaleString("en-US")} VND - {item.orders || 0} orders
                  </p>
                </div>
              ))}
              {monthlyStats.length === 0 && <p className="text-sm text-slate-500">No data available.</p>}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-900">New users by month</p>
            <div className="mt-2 space-y-1.5">
              {monthlyUsers.slice(-8).map((item) => (
                <div key={`${item._id?.year}-${item._id?.month}`} className="text-sm flex items-center justify-between">
                  <span className="text-slate-600">
                    {String(item._id?.month || "").padStart(2, "0")}/{item._id?.year}
                  </span>
                  <span className="font-semibold text-slate-800">{item.count || 0}</span>
                </div>
              ))}
              {monthlyUsers.length === 0 && <p className="text-sm text-slate-500">No data available.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminReportsPage;

