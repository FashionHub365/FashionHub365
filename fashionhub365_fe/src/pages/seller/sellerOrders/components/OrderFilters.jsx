import React from 'react';
import { STATUS_CONFIG } from './OrderUtils';

const OrderFilters = ({ activeFilter, onFilterChange, orders }) => {
    const tabs = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        count: key === 'all' ? orders.length : orders.filter(o => o.status === key).length,
        dot: cfg.dot,
    }));

    return (
        <div className="flex gap-1.5 flex-wrap mb-5">
            {tabs.map(({ key, label, count, dot }) => {
                const active = activeFilter === key;
                return (
                    <button
                        key={key}
                        onClick={() => onFilterChange(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                            ${active
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                            }`}
                    >
                        {!active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />}
                        {label}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                            ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default OrderFilters;
