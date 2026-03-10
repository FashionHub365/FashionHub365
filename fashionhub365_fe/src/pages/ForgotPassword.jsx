import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../apis/authApi';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Client-side validation
        if (!email.trim()) {
            setError('Vui lòng nhập Email');
            return;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Email không hợp lệ');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            if (response.success) {
                setSuccessMessage(response.data.message || 'If that email exists, a reset link has been sent.');
                setEmail(''); // Clear form on success
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative flex flex-col justify-center text-left transform transition-all hover:scale-[1.01]">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Forgot Password?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'} focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition duration-200 outline-none`}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError('');
                            }}
                        />
                        {error && <p className="mt-1 text-xs text-red-600 font-medium" style={{ color: '#dc2626' }}>{error}</p>}
                    </div>

                    {successMessage && (
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                            <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all duration-300 ${(isLoading || !!successMessage) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
