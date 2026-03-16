import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminOverviewService } from "../services/adminOverviewService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const orderColors = ["#4f46e5", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#f43f5e"];

const demoRecentOrders = [
  { id: "#ORD-2023-001", initials: "JD", customer: "John Doe", total: 1240.00, status: "SUCCESS", time: "Oct 24, 2023" },
  { id: "#ORD-2023-002", initials: "SK", customer: "Sarah King", total: 840.50, status: "PENDING", time: "Oct 24, 2023" },
  { id: "#ORD-2023-003", initials: "MW", customer: "Mike Wilson", total: 3120.00, status: "SUCCESS", time: "Oct 23, 2023" },
  { id: "#ORD-2023-004", initials: "LC", customer: "Lisa Chen", total: 450.00, status: "CANCELLED", time: "Oct 22, 2023" },
  { id: "#ORD-2023-005", initials: "AJ", customer: "Alex James", total: 105.00, status: "SUCCESS", time: "Oct 20, 2023" },
];

const formatMoney = (value) => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const toGrowth = (current, previous) => {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p <= 0) return c > 0 ? 100 : 0;
  return ((c - p) / p) * 100;
};

const CardSkeleton = ({ className = "" }) => <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;

const LineChart = ({ values }) => {
  const safe = values && values.length > 0 ? values : [100, 150, 120, 180, 140, 220, 250, 200, 300, 220, 280, 400];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = max - min;
  const points = safe
    .map((value, idx) => {
      const x = (idx / Math.max(safe.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / Math.max(range, 1)) * 80 - 10; // keep some padding
      return `${x},${y}`;
    })
    .join(" ");

  // Generate smooth curve for SVG
  const generateSmoothPath = (pointsArray) => {
    if (pointsArray.length === 0) return "";
    let d = `M ${pointsArray[0].x},${pointsArray[0].y}`;
    for (let i = 1; i < pointsArray.length - 1; i++) {
      const xc = (pointsArray[i].x + pointsArray[i + 1].x) / 2;
      const yc = (pointsArray[i].y + pointsArray[i + 1].y) / 2;
      d += ` Q ${pointsArray[i].x},${pointsArray[i].y} ${xc},${yc}`;
    }
    if (pointsArray.length > 1) {
      d += ` T ${pointsArray[pointsArray.length - 1].x},${pointsArray[pointsArray.length - 1].y}`;
    }
    return d;
  };

  const parsedPoints = safe.map((value, idx) => ({
    x: (idx / Math.max(safe.length - 1, 1)) * 100,
    y: 100 - ((value - min) / Math.max(range, 1)) * 80 - 10
  }));

  const smoothPath = generateSmoothPath(parsedPoints);

  return (
    <div className="relative w-full h-64 mt-6">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${smoothPath} L 100,100 L 0,100 Z`} fill="url(#gradientLine)" stroke="none" />
        <path d={smoothPath} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Plot dot on a point */}
        {parsedPoints.length > 0 && (
          <circle cx={parsedPoints[5]?.x || 50} cy={parsedPoints[5]?.y || 50} r="1.5" fill="#4f46e5" stroke="white" strokeWidth="0.5" />
        )}
      </svg>

      {/* X Axis Labels */}
      <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">
        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
        <span className="hidden sm:inline">Jul</span><span className="hidden sm:inline">Aug</span>
        <span className="hidden sm:inline">Sep</span><span className="hidden sm:inline">Oct</span>
        <span className="hidden sm:inline">Nov</span><span className="hidden sm:inline">Dec</span>
      </div>
    </div>
  );
};

const DonutChart = ({ segments }) => {
  const total = segments.reduce((sum, item) => sum + Number(item.value || 0), 0);

  // Use demo data to match the image if no data
  const finalSegments = total > 0 ? segments : [
    { label: "Electronics (45%)", value: 45, color: "#4f46e5" },
    { label: "Furniture (30%)", value: 30, color: "#f59e0b" },
    { label: "Clothing (25%)", value: 25, color: "#10b981" }
  ];

  const finalTotal = total > 0 ? total : 100;
  
  let currentOffset = 0;
  
  // Calculate SVG stroke parameters
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  return (
    <div className="flex flex-col items-center justify-center mt-6 h-full">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          {finalSegments.map((item, idx) => {
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
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            {total > 0 ? formatCount(total) : "1.5k"}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Total Sales</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 w-full px-4">
        {finalSegments.map((seg, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: seg.color }}></span>
            <span className="text-xs text-slate-600 font-medium leading-tight">{seg.label || seg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendIndicator = ({ value }) => {
  const isUp = value >= 0;
  const color = isUp ? "text-emerald-500" : "text-rose-500";
  return (
    <div className={`flex items-center gap-0.5 text-xs font-bold ${color}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d={isUp ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
};

const MiniBarChart = () => (
  <div className="flex items-end gap-1.5 h-6 mt-4 opacity-70">
    {[30, 45, 25, 60, 90, 40, 50, 75].map((h, i) => (
      <div key={i} className="w-3 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 4 ? '#4f46e5' : '#c7d2fe' }} />
    ))}
  </div>
);

const AdminOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalRevenue: 1284500.00, totalUsers: 42893, totalOrders: 1562 });
  const [trend] = useState({ revenue: 2.5, users: 6.2, orders: -1.1, tickets: -2.4 });
  const dashboardRef = useRef(null);

  const loadDashboard = async () => {
    setLoading(true);
    // Fake loading for fluid UI
    setTimeout(() => {
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleExportData = async () => {
    try {
      const element = dashboardRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard_overview_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export PDF screenshot.");
    }
  };

  return (
    <div ref={dashboardRef} className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-4 rounded-3xl">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">Monitor your enterprise metrics and real-time performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Oct 1, 2023 - Oct 31, 2023</span>
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <TrendIndicator value={trend.revenue} />
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wide mb-1">Total Revenue</p>
          <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight">${formatMoney(summary.totalRevenue)}</h3>
          <div className="mt-4 h-1.5 w-24 bg-emerald-400 rounded-full opacity-80" />
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <TrendIndicator value={trend.users} />
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wide mb-1 mt-4">Active Users</p>
          <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight">{formatCount(summary.totalUsers)}</h3>
          <MiniBarChart />
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <TrendIndicator value={trend.orders} />
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wide mb-1">New Orders</p>
          <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight">{formatCount(summary.totalOrders)}</h3>
          <p className="mt-4 text-[10px] sm:text-xs font-semibold text-slate-400">Updated 5 mins ago</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <TrendIndicator value={trend.tickets} />
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wide mb-1">Pending Tickets</p>
          <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight">48</h3>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              <img className="w-6 h-6 rounded-full border border-white" src="https://ui-avatars.com/api/?name=Alex&background=random" alt="" />
              <img className="w-6 h-6 rounded-full border border-white" src="https://ui-avatars.com/api/?name=Sarah&background=random" alt="" />
              <div className="w-6 h-6 rounded-full border border-white bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center">+12</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm xl:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Growth</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Year over year performance comparison</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Last 12 Months
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {loading ? <CardSkeleton className="h-64 mt-6" /> : <LineChart />}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales by Category</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Distribution of item sales</p>
          </div>
          {loading ? <CardSkeleton className="h-64 mt-6" /> : <DonutChart segments={[]} />}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Transactions</h3>
          <button className="text-[13px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demoRecentOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.id}</td>
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
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${order.status === 'SUCCESS' ? 'bg-emerald-100/60 text-emerald-600' :
                      order.status === 'PENDING' ? 'bg-amber-100/60 text-amber-600' :
                        'bg-rose-100/60 text-rose-600'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
