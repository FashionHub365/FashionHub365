import React from 'react';

const StatCard = ({ title, value, sub, icon, accent }) => (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="relative bg-white rounded-2xl p-5 overflow-hidden border border-gray-100 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
        {/* accent blob */}
        <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 ${accent}`} />
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${accent} bg-opacity-15`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

export default StatCard;
