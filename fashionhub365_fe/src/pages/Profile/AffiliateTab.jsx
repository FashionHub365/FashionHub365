import React, { useEffect, useState, useCallback } from "react";
import affiliateApi from "../../apis/affiliateApi";
import referralApi from "../../apis/referralApi";
import Swal from "sweetalert2";

const AffiliateTab = ({ user }) => {
    const [activeSubTab, setActiveSubTab] = useState("overview"); // overview, programs, links, commissions
    const [stats, setStats] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [myLinks, setMyLinks] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, linksRes] = await Promise.all([
                referralApi.getReferralStats(),
                affiliateApi.getMyLinks()
            ]);
            if (statsRes.data?.success) setStats(statsRes.data.data);
            if (linksRes.data?.success) setMyLinks(linksRes.data.data || []);
        } catch (err) {
            console.error("Failed to load affiliate stats", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await affiliateApi.getPrograms({ status: 'active' });
            if (res.data?.success) setPrograms(res.data.data || []);
        } catch (err) {
            console.error("Failed to load programs", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCommissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await affiliateApi.getMyCommissions();
            if (res.data?.success) setCommissions(res.data.data || []);
        } catch (err) {
            console.error("Failed to load commissions", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeSubTab === "overview") loadOverview();
        else if (activeSubTab === "programs") loadPrograms();
        else if (activeSubTab === "links") loadOverview(); // Links shared with overview for now
        else if (activeSubTab === "commissions") loadCommissions();
    }, [activeSubTab, loadOverview, loadPrograms, loadCommissions]);

    const handleJoinProgram = async (programId) => {
        setProcessing(true);
        try {
            const res = await affiliateApi.generateLink(programId);
            if (res.data?.success) {
                Swal.fire("Success", "Affiliate link generated!", "success");
                setActiveSubTab("links");
                loadOverview();
            }
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to join program", "error");
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        Swal.fire({
            title: "Copied!",
            text: "Link copied to clipboard",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    };

    if (loading && !stats && programs.length === 0) {
        return <div className="py-20 text-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {["overview", "programs", "links", "commissions"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeSubTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeSubTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl text-white shadow-lg">
                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Total Earnings</p>
                            <p className="text-2xl font-black mt-1">{(stats?.total_earned || 0).toLocaleString('vi-VN')}₫</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Referrals</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{stats?.total_referrals || 0}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Links</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{myLinks.length}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                        <h4 className="font-bold text-indigo-900">Your Referral Code</h4>
                        <p className="text-sm text-indigo-700/70 mb-4">Share this code with friends to earn rewards on their first purchase.</p>
                        <div className="flex gap-2">
                            <div className="bg-white px-4 py-3 rounded-xl font-mono text-lg font-bold border border-indigo-200 flex-1 flex items-center justify-center tracking-widest">
                                {user?.profile?.referral_code || 'N/A'}
                            </div>
                            <button
                                onClick={() => copyToClipboard(user?.profile?.referral_code)}
                                className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === "programs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-300">
                    {programs.map(prog => (
                        <div key={prog._id} className="bg-white border border-slate-200 p-5 rounded-2xl hover:border-indigo-300 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-900">{prog.name}</h4>
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">{prog.commission_rate}% Commission</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2">{prog.description || 'Join our program and earn commissions on every sale you refer.'}</p>
                            <button
                                onClick={() => handleJoinProgram(prog._id)}
                                disabled={processing}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
                            >
                                {myLinks.some(l => l.program_id?._id === prog._id || l.program_id === prog._id) ? 'Already Joined' : 'Generate Link'}
                            </button>
                        </div>
                    ))}
                    {programs.length === 0 && <p className="col-span-2 text-center py-10 text-slate-400 font-medium">No active programs available at the moment.</p>}
                </div>
            )}

            {activeSubTab === "links" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {myLinks.map(link => (
                        <div key={link._id} className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-900">{link.program_id?.name || 'Program'}</h4>
                                <p className="text-xs text-slate-400 mt-1">Earnings: <span className="text-emerald-600 font-bold">{(link.total_commission || 0).toLocaleString()}₫</span> • Clicks: <span className="text-indigo-600 font-bold">{link.click_count || 0}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <input readOnly value={link.full_url || `${window.location.origin}/aff/${link.short_code}`} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-mono w-full md:w-64" />
                                <button onClick={() => copyToClipboard(link.full_url || `${window.location.origin}/aff/${link.short_code}`)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {myLinks.length === 0 && <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400">You haven't generated any affiliate links yet.</p></div>}
                </div>
            )}

            {activeSubTab === "commissions" && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4">Transaction</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {commissions.map(comm => (
                                <tr key={comm._id} className="hover:bg-slate-50/50">
                                    <td className="px-5 py-4"><p className="font-bold text-slate-800 text-sm">{comm.order_id?.order_code || '#ORD-ID'}</p><p className="text-[10px] text-slate-400">{new Date(comm.created_at).toLocaleDateString()}</p></td>
                                    <td className="px-5 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${comm.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{comm.status}</span></td>
                                    <td className="px-5 py-4 text-right font-black text-slate-900">{(comm.amount || 0).toLocaleString()}₫</td>
                                </tr>
                            ))}
                            {commissions.length === 0 && <tr><td colSpan="3" className="text-center py-10 text-slate-400">No commission history found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AffiliateTab;
