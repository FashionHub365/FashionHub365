import React, { useEffect, useState } from 'react';
import walletApi from '../../apis/walletApi';
import { showError, showSuccess } from '../../utils/swalUtils';

const SellerWallet = () => {
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [settledBalance, setSettledBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [balanceRes, transRes] = await Promise.all([
                walletApi.getBalance(),
                walletApi.getTransactions({ limit: 10 }),
            ]);

            if (balanceRes?.success) {
                setBalance(Number(balanceRes.data?.availableBalance || balanceRes.data?.balance || 0));
                setPendingBalance(Number(balanceRes.data?.pendingBalance || 0));
                setSettledBalance(Number(balanceRes.data?.settledBalance || 0));
            }

            if (transRes?.success) {
                setTransactions(Array.isArray(transRes.data?.items) ? transRes.data.items : []);
            }
        } catch (err) {
            setError('Failed to load wallet data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0 || amount > balance) {
            showError('Invalid payout amount or amount exceeds your available balance.');
            return;
        }

        try {
            await walletApi.requestPayout({ amount, method: 'BANK_TRANSFER' });
            showSuccess('Payout request submitted successfully.');
            setShowWithdraw(false);
            setWithdrawAmount('');
            fetchWalletData();
        } catch (err) {
            showError(`Payout request failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'DEPOSIT':
                return <div className="p-2 bg-green-100 text-green-600 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg></div>;
            case 'WITHDRAW':
                return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg></div>;
            case 'PAYMENT':
                return <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>;
            case 'REFUND':
                return <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg></div>;
            default:
                return <div className="p-2 bg-gray-100 text-gray-600 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
        }
    };

    const formatTransactionType = (tx) => {
        if (tx?.reference?.includes('Settlement reversal')) return 'Settlement Reversal';
        if (tx?.reference?.includes('Payout completed')) return 'Payout';
        if (tx?.reference?.includes('Settlement released')) return 'Settlement Release';
        return String(tx?.type || 'Transaction').replace('_', ' ');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading wallet data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Seller Wallet</h2>
                    <p className="text-sm text-gray-500 mt-1">Track pending releases, available payout balance and settlement activity.</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h2.45c.14 1.13.9 1.48 2.05 1.48 1.45 0 2.06-.7 2.06-1.55 0-2.31-5.11-1.09-5.11-4.7 0-1.78 1.34-3.08 3.22-3.4V4.9h2.67v1.95c1.47.36 2.76 1.44 2.94 3.09h-2.43c-.15-1.02-.91-1.48-1.92-1.48-1.09 0-1.9.64-1.9 1.48 0 2.1 5.11.96 5.11 4.75 0 1.94-1.4 3.05-3.2 3.4z" /></svg>
                </div>
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Available Balance</p>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-6">
                        {balance.toLocaleString('vi-VN')} VND
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-3xl">
                        <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">Available to payout</p>
                            <p className="mt-1 text-lg font-bold">{balance.toLocaleString('vi-VN')} VND</p>
                        </div>
                        <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">Pending release</p>
                            <p className="mt-1 text-lg font-bold">{pendingBalance.toLocaleString('vi-VN')} VND</p>
                        </div>
                        <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">Released lifetime</p>
                            <p className="mt-1 text-lg font-bold">{settledBalance.toLocaleString('vi-VN')} VND</p>
                        </div>
                    </div>
                    {balance < 0 ? (
                        <p className="mt-4 text-sm text-amber-100">
                            Your wallet is temporarily negative because completed refunds reversed previously released seller funds.
                        </p>
                    ) : null}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => setShowWithdraw(true)}
                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            Withdraw Funds
                        </button>
                    </div>
                </div>
            </div>

            {showWithdraw && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Request Payout</h3>
                        <form onSubmit={handleWithdraw}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (VND)</label>
                                <input
                                    type="number"
                                    min="10000"
                                    max={balance > 0 ? balance : 0}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2">Available: {balance.toLocaleString('vi-VN')} VND</p>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowWithdraw(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Confirm Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No transactions found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                            <div key={tx._id} className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors px-2 rounded-lg">
                                <div className="flex items-center gap-4">
                                    {getTransactionIcon(tx.type)}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{formatTransactionType(tx)}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                                        {tx.reference ? <p className="text-xs text-gray-400 mt-1">{tx.reference}</p> : null}
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${Number(tx.amount || 0) >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {Number(tx.amount || 0) >= 0 ? '+' : '-'}
                                    {Math.abs(Number(tx.amount || 0)).toLocaleString('vi-VN')} VND
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerWallet;
