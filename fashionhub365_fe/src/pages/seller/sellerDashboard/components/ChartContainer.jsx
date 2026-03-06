import React from 'react';

const ChartContainer = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 ${className}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <div className="flex-1 min-h-[200px]">
            {children}
        </div>
    </div>
);

export default ChartContainer;
