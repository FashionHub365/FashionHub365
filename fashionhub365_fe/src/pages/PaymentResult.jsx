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
        const loadPayment = async () => {
            try {
                if (transactionId) {
                    const response = await paymentApi.queryVNPayPayment(transactionId);
                    if (response.success) {
                        setPayment(response.data);
                        return;
                    }
                }

                if (paymentUuid) {
                    const response = await paymentApi.getPaymentStatus(paymentUuid);
                    if (response.success) {
                        setPayment(response.data);
                        return;
                    }
                }

                setPayment({
                    paymentUuid,
                    transactionId,
                    status: statusFromQuery || 'PENDING',
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load payment result');
                setPayment({
                    paymentUuid,
                    transactionId,
                    status: statusFromQuery || 'FAILED',
                });
            } finally {
                setLoading(false);
            }
        };

        loadPayment();
    }, [paymentUuid, transactionId, statusFromQuery]);

    const status = payment?.status || statusFromQuery || 'PENDING';
    const isSuccess = status === 'PAID';

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Payment Result</h1>
                <p className="mt-2 text-sm text-gray-500">VNPay callback result</p>

                {loading && (
                    <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                        Checking payment status...
                    </div>
                )}

                {!loading && (
                    <div className={`mt-6 rounded-xl border p-5 ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className={`text-lg font-semibold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                            {isSuccess ? 'Payment successful' : 'Payment not completed'}
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
