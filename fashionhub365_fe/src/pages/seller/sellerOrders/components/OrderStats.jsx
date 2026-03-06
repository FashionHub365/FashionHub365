import React from 'react';
import { STAT_CARDS } from './OrderUtils';

const OrderStats = ({ orders }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map(({ key, label, icon, compute }) => (
            <div key={key}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{compute(orders)}</p>
                </div>
            </div>
        ))}
    </div>
);

export default OrderStats;
