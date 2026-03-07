import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import paymentApi from '../apis/paymentApi';

export const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const paymentUuid = searchParams.get('paymentUuid');
    const transactionId = searchParams.get('transactionId');
    const statusFromQuery = searchParams.get('status');
    const responseCode = searchParams.get('responseCode');

    useEffect(() => {
        let mounted = true;
        let timer = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 40;
        const POLL_INTERVAL_MS = 3000;

        const loadCurrentStatus = async () => {
            if (transactionId) {
                const response = await paymentApi.queryVNPayPayment(transactionId);
                if (response.success) {
                    return response.data;
                }
            }

            if (paymentUuid) {
                const response = await paymentApi.getPaymentStatus(paymentUuid);
                if (response.success) {
                    return response.data;
                }
            }

            return {
                paymentUuid,
                transactionId,
                status: statusFromQuery || 'PENDING',
            };
        };

        const poll = async () => {
            let scheduledNext = false;
            try {
                const current = await loadCurrentStatus();
                if (!mounted) {
                    return;
                }

                setPayment(current);
                setError('');

                const currentStatus = current?.status || 'PENDING';
                const shouldPoll = currentStatus === 'PENDING' && attempts < MAX_ATTEMPTS;

                if (shouldPoll) {
                    attempts += 1;
                    scheduledNext = true;
                    timer = setTimeout(poll, POLL_INTERVAL_MS);
                    return;
                }
            } catch (err) {
                if (!mounted) {
                    return;
                }
                setError(err.response?.data?.message || 'Unable to verify payment right now');
                setPayment((prev) => prev || {
                    paymentUuid,
                    transactionId,
                    status: statusFromQuery || 'PENDING',
                });

                if (attempts < MAX_ATTEMPTS) {
                    attempts += 1;
                    scheduledNext = true;
                    timer = setTimeout(poll, POLL_INTERVAL_MS);
                    return;
                }
            } finally {
                if (mounted && !scheduledNext) {
                    setLoading(false);
                }
            }
        };

        poll();

        return () => {
            mounted = false;
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [paymentUuid, transactionId, statusFromQuery]);

    const status = payment?.status || statusFromQuery || 'PENDING';
    const isSuccess = status === 'PAID';
    const isPending = status === 'PENDING';
    const isFailed = !isSuccess && !isPending;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Payment Result</h1>
                <p className="mt-2 text-sm text-gray-500">VNPay callback result</p>

                {loading && (
                    <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                        Dang xac nhan thanh toan...
                    </div>
                )}

                {!loading && (
                    <div className={`mt-6 rounded-xl border p-5 ${isSuccess ? 'border-green-200 bg-green-50' : isPending ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
                        <div className={`text-lg font-semibold ${isSuccess ? 'text-green-700' : isPending ? 'text-amber-700' : 'text-red-700'}`}>
                            {isSuccess ? 'Payment successful' : isPending ? 'Dang cho webhook xac nhan' : 'Payment not completed'}
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                            <div>Payment UUID: {payment?.paymentUuid || 'N/A'}</div>
                            <div>Transaction ID: {payment?.transactionId || 'N/A'}</div>
                            <div>Status: {status}</div>
                            <div>VNPay response code: {responseCode || 'N/A'}</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && isFailed && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        Neu ban da thanh toan nhung trang thai chua cap nhat, vui long cho 1-2 phut de he thong reconcile.
                    </div>
                )}

                <div className="mt-8 flex gap-3">
                    <Link to="/" className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white">
                        Back to home
                    </Link>
                    <Link to="/profile" className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700">
                        View profile
                    </Link>
                </div>
            </div>
        </div>
    );
};
