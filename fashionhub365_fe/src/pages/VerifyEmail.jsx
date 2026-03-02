import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authApi from '../apis/authApi';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await authApi.verifyEmail(token);
                setStatus('success');
                setMessage('Email verified successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Link might be expired.');
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl text-center">
                {status === 'verifying' && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900">Verifying Email</h2>
                        <p className="mt-2 text-gray-600 animate-pulse">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mt-4">Verified!</h2>
                        <p className="mt-2 text-green-600">{message}</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mt-4">Verification Failed</h2>
                        <p className="mt-2 text-red-600">{message}</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
