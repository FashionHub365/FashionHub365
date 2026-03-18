import React, { useEffect, useState } from "react";
import referralApi from "../../apis/referralApi";

const ReferralTab = ({ user }) => {
    const [referralCode, setReferralCode] = useState(user?.profile?.referral_code || '');
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                const [statsRes, historyRes] = await Promise.all([
                    referralApi.getReferralStats(),
                    referralApi.getReferralHistory()
                ]);

                if (statsRes.data?.success) setStats(statsRes.data.data);
                if (historyRes.data?.success) setHistory(historyRes.data.data.items || []);
            } catch (err) {
                console.error("Failed to load referral data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferralData();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="py-16 text-center text-sm text-gray-500">Loading referral data...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-2">Invite Friends, Earn Rewards!</h3>
                <p className="text-indigo-100 text-sm mb-6 max-w-xl">Share your unique referral code with friends. When they sign up and make their first purchase, you both earn bonus points in your wallet!</p>

                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                    <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/20 rounded-lg py-3 px-4 font-mono text-xl font-bold tracking-widest text-center select-all">
                            {referralCode || 'NO-CODE-YET'}
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={`flex items-center justify-center h-12 px-6 rounded-lg font-bold transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 hover:bg-gray-50'}`}
                        >
                            {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Referrals</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.total_referrals || 0}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Earned</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{(stats?.total_earned || 0).toLocaleString('vi-VN')}₫</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Rewards</p>
                    <p className="mt-2 text-3xl font-bold text-orange-500">{(stats?.pending_rewards || 0).toLocaleString('vi-VN')}₫</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900">Referral History</h4>
                </div>
                {history.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No referrals yet. Start sharing your code!</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reward</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                                            {item.referred_user_id?.username || 'Unknown User'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                item.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-right font-bold text-green-600">
                                            {item.reward_amount ? `+${item.reward_amount.toLocaleString('vi-VN')}₫` : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500 text-right">
                                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralTab;
