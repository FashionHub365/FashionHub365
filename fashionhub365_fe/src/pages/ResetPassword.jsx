import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [statusData, setStatusData] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Extract token from URL ?token=...
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatusData({
                type: 'error',
                message: 'Invalid or missing password reset token. Please request a new one.'
            });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) return;

        if (newPassword !== confirmPassword) {
            setStatusData({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        if (newPassword.length < 8) {
            setStatusData({ type: 'error', message: 'Password must be at least 8 characters long.' });
            return;
        }

        setStatusData({ type: '', message: '' });
        setIsLoading(true);

        const result = await resetPassword(token, newPassword);
        setIsLoading(false);

        if (result.success) {
            setStatusData({
                type: 'success',
                message: 'Your password has been reset successfully. Redirecting to login...'
            });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setStatusData({
                type: 'error',
                message: result.message || 'Failed to reset password. The link might be expired.'
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all hover:scale-[1.01]">

                {/* Left Side */}
                <div className="w-full md:w-1/2 relative hidden md:block">
                    <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2040&auto=format&fit=crop"
                        alt="Fashion"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="text-center p-8 text-white">
                            <h2 className="text-4xl font-bold mb-4 tracking-wider">FashionHub365</h2>
                            <p className="text-lg font-light opacity-90">Secure your account with a fresh new password.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-900 relative flex flex-col justify-center text-left">
                    <div className="text-left mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Set New Password</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Please type and confirm your new password below.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    disabled={!token || statusData.type === 'success'}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition duration-200 outline-none pr-10 disabled:opacity-50"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={!token || statusData.type === 'success'}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                disabled={!token || statusData.type === 'success'}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition duration-200 outline-none disabled:opacity-50"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {statusData.message && (
                            <div className={`p-4 rounded-lg text-sm border flex items-start ${statusData.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200 animate-pulse'}`}>
                                {statusData.type === 'success' ? (
                                    <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                )}
                                <span className="leading-relaxed">{statusData.message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !token || statusData.type === 'success'}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-0.5 ${(isLoading || !token || statusData.type === 'success') ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : null}
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>

                    {!token && (
                        <div className="mt-6 text-center">
                            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Request a new reset link
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
