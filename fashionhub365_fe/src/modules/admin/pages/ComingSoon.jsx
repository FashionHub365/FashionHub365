import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title = "Feature Coming Soon" }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{title}</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                We're working hard to bring this feature to you. In the meantime, you can explore other sections of the admin panel.
            </p>
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
                Go to Dashboard
            </button>
        </div>
    );
};

export default ComingSoon;
