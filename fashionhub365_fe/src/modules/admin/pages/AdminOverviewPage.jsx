import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { adminOverviewService } from "../services/adminOverviewService";
import { showError } from "../../../utils/swalUtils";

const orderColors = ["#4f46e5", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#f43f5e"];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const CardSkeleton = ({ className = "" }) => <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;

const TrendIndicator = ({ value = 0 }) => {
  const numeric = Number(value || 0);
  const isUp = numeric >= 0;
  const color = isUp ? "text-emerald-500" : "text-rose-500";

  return (
    <div className={`flex items-center gap-0.5 text-xs font-bold ${color}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isUp ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
      <span>{Math.abs(numeric).toFixed(1)}%</span>
    </div>
  );
};

const LineChart = ({ values = [] }) => {
  const safe = values.length > 0 ? values : [0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = max - min;

  const points = safe.map((value, idx) => ({
    x: (idx / Math.max(safe.length - 1, 1)) * 100,
    y: 100 - ((value - min) / Math.max(range, 1)) * 80 - 10,
  }));

  const buildSmoothPath = (items) => {
    if (items.length === 0) return "";
    let d = `M ${items[0].x},${items[0].y}`;
    for (let i = 1; i < items.length - 1; i += 1) {
      const xc = (items[i].x + items[i + 1].x) / 2;
      const yc = (items[i].y + items[i + 1].y) / 2;
      d += ` Q ${items[i].x},${items[i].y} ${xc},${yc}`;
    }
    if (items.length > 1) {
      d += ` T ${items[items.length - 1].x},${items[items.length - 1].y}`;
    }
    return d;
  };

  const path = buildSmoothPath(points);

  return (
    <div className="relative w-full h-64 mt-6">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="platformRevenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100,100 L 0,100 Z`} fill="url(#platformRevenueGradient)" stroke="none" />
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span className="hidden sm:inline">Jul</span>
        <span className="hidden sm:inline">Aug</span>
        <span className="hidden sm:inline">Sep</span>
        <span className="hidden sm:inline">Oct</span>
        <span className="hidden sm:inline">Nov</span>
        <span className="hidden sm:inline">Dec</span>
      </div>
    </div>
  );
};

const DonutChart = ({ segments = [] }) => {
  const total = segments.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const fallback = total > 0 ? segments : [{ label: "No data", value: 1, color: "#e2e8f0" }];
  const finalTotal = total > 0 ? total : 1;
  const size = 200;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center justify-start pt-4 pb-2">
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {fallback.map((item, idx) => {
            const value = Number(item.value || 0);
            const percent = value / finalTotal;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset * circumference;
            currentOffset += percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap={total > 0 ? "round" : "butt"}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-3xl font-black text-slate-800 leading-none">{total > 0 ? formatCount(total) : "0"}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 leading-tight">Order status</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 w-full px-2">
        {fallback.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2 min-w-[120px] justify-center sm:justify-start">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-slate-600 font-bold whitespace-nowrap uppercase tracking-tight">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverviewCard = ({ title, value, trend, tone, subtitle }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-500",
    indigo: "bg-indigo-50 text-indigo-500",
    amber: "bg-amber-50 text-amber-500",
    sky: "bg-sky-50 text-sky-500",
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone] || tones.indigo}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1H9m3 0h3" />
          </svg>
        </div>
        {typeof trend === "number" ? <TrendIndicator value={trend} /> : null}
      </div>
      <p className="text-xs text-slate-400 font-bold tracking-wide mb-1">{title}</p>
      <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight">{value}</h3>
      {subtitle ? <p className="mt-4 text-[10px] sm:text-xs font-semibold text-slate-400">{subtitle}</p> : null}
    </div>
  );
};

const AdminOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await adminOverviewService.getSystemStats();
        setStats(response);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Khong the tai du lieu thong ke.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleExportData = async () => {
    try {
      const element = dashboardRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard_overview_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
      showError("Xuat PDF that bai.");
    }
  };

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 bg-slate-50 p-4 rounded-3xl animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-100 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-100 xl:col-span-2" />
          <div className="h-80 bg-white rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalRevenue: 0,
    platformRevenue: 0,
    platformRevenueRecognized: 0,
    platformRevenueReversed: 0,
    sellerPayablePending: 0,
    sellerReleased: 0,
    totalUsers: 0,
    totalOrders: 0,
  };
  const trend = stats?.trend || { revenue: 0, users: 0, orders: 0, platformRevenue: 0 };
  const recentOrders = stats?.recentOrders || [];
  const monthlyStats = stats?.monthlyStats || [];
  const monthlyPlatformStats = stats?.monthlyPlatformStats || [];
  const ordersByStatus = (stats?.ordersByStatus || []).map((item, idx) => ({
    label: `${item._id} (${item.count})`,
    value: item.count,
    color: orderColors[idx % orderColors.length],
  }));
  const platformRevenueChartData = monthlyPlatformStats.length > 0
    ? monthlyPlatformStats.map((item) => item.netRevenue ?? item.platformRevenue ?? 0)
    : monthlyStats.map((item) => item.revenue);

  return (
    <div ref={dashboardRef} className="max-w-7xl mx-auto space-y-6 bg-slate-50 p-2 sm:p-4 rounded-3xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">Tong quan he thong</h2>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">
            Theo doi GMV, doanh thu san va tien can thanh toan cho seller.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date().toLocaleDateString("vi-VN")}</span>
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuat du lieu</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <OverviewCard
          title="Tong GMV"
          value={`$${formatMoney(summary.totalRevenue)}`}
          trend={trend.revenue}
          tone="emerald"
          subtitle="Tong gia tri don hang tren san"
        />
        <OverviewCard
          title="Doanh thu san"
          value={`$${formatMoney(summary.platformRevenue)}`}
          trend={trend.platformRevenue}
          tone="indigo"
          subtitle="Net platform fee sau reversal/refund"
        />
        <OverviewCard
          title="Cho tra seller"
          value={`$${formatMoney(summary.sellerPayablePending)}`}
          tone="amber"
          subtitle="Tien da thu nhung chua release vao vi seller"
        />
        <OverviewCard
          title="Tong don hang"
          value={formatCount(summary.totalOrders)}
          trend={trend.orders}
          tone="sky"
          subtitle={`Users: ${formatCount(summary.totalUsers)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm xl:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tang truong doanh thu san</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Platform fee theo thang</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Recognized / Reversed</p>
              <p className="text-lg font-black text-slate-800">${formatMoney(summary.platformRevenueRecognized)}</p>
              <p className="text-xs text-rose-500 font-bold mt-1">-${formatMoney(summary.platformRevenueReversed)}</p>
            </div>
          </div>
          {loading ? <CardSkeleton className="h-64 mt-6" /> : <LineChart values={platformRevenueChartData} />}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Trang thai don hang</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Phan bo order trong he thong</p>
          </div>
          {loading ? <CardSkeleton className="h-64 mt-6" /> : <DonutChart segments={ordersByStatus} />}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent orders with fee breakdown</h3>
            <p className="text-xs text-slate-500 mt-1">Admin co the thay san giu bao nhieu va seller nhan bao nhieu tren tung don.</p>
          </div>
          <Link to="/admin/orders" className="text-[13px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            Xem tat ca
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Platform fee</th>
                <th className="px-6 py-4">Seller net</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-sm">
                    Chua co don hang nao.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center tracking-tight">
                          {order.initials}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{order.time}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">${formatMoney(order.total)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-700">${formatMoney(order.platformFee)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-700">${formatMoney(order.sellerNet)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                            order.status === "DELIVERED" || order.status === "SUCCESS"
                              ? "bg-emerald-100/60 text-emerald-600"
                              : order.status === "PENDING" || order.status === "CREATED"
                                ? "bg-amber-100/60 text-amber-600"
                                : "bg-rose-100/60 text-rose-600"
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.settlementStatus ? (
                          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            Settlement: {order.settlementStatus}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/admin/orders?search=${order.orderNumber}`} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors inline-block">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
