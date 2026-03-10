import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authApi from '../apis/authApi';

export const ResetPassword = () => {
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Extract token from URL query string
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setIsCheckingToken(false);
                setTokenValid(false);
                return;
            }

            try {
                // Adjust this call if your backend requires token in body or params differently
                const response = await authApi.validateResetToken(token);
                // Axios interceptor usually unwraps `data` but assuming it matches `authApi.js` setup
                if (response.success && response.data?.valid) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                }
            } catch (err) {
                setTokenValid(false);
            } finally {
                setIsCheckingToken(false);
            }
        };

        checkToken();
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
        if (errors.global) {
            setErrors({ ...errors, global: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        let newErrors = {};

        if (!formData.newPassword) {
            newErrors.newPassword = 'Vui lòng nhập Mật khẩu mới';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không trùng khớp';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.resetPassword({
                token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            if (response.success) {
                setSuccessMessage('Password reset successful. Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setErrors({ global: err.response?.data?.error?.message || err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="text-white text-lg flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying secure link...
                </div>
            </div>
        );
    }

    if (!tokenValid && !successMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative flex flex-col justify-center text-center transform transition-all">
                    <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid or Expired Link</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">The password reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative flex flex-col justify-center text-left transform transition-all hover:scale-[1.01]">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Create New Password
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Your new password must be different from previous used passwords.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            className={`w-full px-4 py-3 rounded-lg border ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'} focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition duration-200 outline-none`}
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                        />
                        {errors.newPassword ? (
                            <p className="mt-1 text-xs font-medium" style={{ color: '#dc2626' }}>{errors.newPassword}</p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'} focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition duration-200 outline-none`}
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <p className="mt-1 text-xs font-medium" style={{ color: '#dc2626' }}>{errors.confirmPassword}</p>}
                    </div>

                    {errors.global && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 font-medium" style={{ color: '#dc2626' }}>
                            {errors.global}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                            <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all duration-300 ${(isLoading || !!successMessage) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
