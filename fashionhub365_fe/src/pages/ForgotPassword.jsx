import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../apis/authApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email.trim()) {
            setError('Vui lòng nhập email.');
            return;
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            setError('Email không hợp lệ.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email.trim());
            if (response.success) {
                setSuccessMessage(response.data?.message || 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#f7f1e8_0%,#ffffff_45%,#eef2f7_100%)] px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-[32px] border border-stone-200 bg-stone-900 p-8 text-white shadow-[0_30px_80px_rgba(17,24,39,0.18)] sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-300">Password Recovery</p>
                    <h1 className="mt-4 max-w-lg text-4xl font-black leading-tight">Lấy lại quyền truy cập tài khoản bằng email.</h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300">
                        Nhập email đăng ký để nhận liên kết đặt lại mật khẩu. Hệ thống sẽ gửi hướng dẫn trực tiếp đến hộp thư của bạn.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Bước 1</p>
                            <p className="mt-2 text-sm font-semibold">Nhập email tài khoản</p>
                            <p className="mt-2 text-sm text-stone-300">Hãy dùng đúng email bạn đã đăng ký trên FashionHub365.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Bước 2</p>
                            <p className="mt-2 text-sm font-semibold">Mở email và đổi mật khẩu</p>
                            <p className="mt-2 text-sm text-stone-300">Liên kết chỉ hoạt động trong thời gian giới hạn để đảm bảo an toàn.</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">Send Reset Email</p>
                        <h2 className="mt-3 text-3xl font-black text-gray-900">Forgot password?</h2>
                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            Điền email của bạn, chúng tôi sẽ gửi một email chứa liên kết đặt lại mật khẩu.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className={`w-full rounded-2xl border px-4 py-3.5 text-gray-900 outline-none transition ${error ? 'border-red-400 bg-red-50/40' : 'border-gray-200 bg-gray-50 focus:border-gray-900'} `}
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError('');
                                    if (successMessage) setSuccessMessage('');
                                }}
                            />
                            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
                        </div>

                        {successMessage && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-sm font-semibold text-emerald-700">Email đã được xử lý</p>
                                <p className="mt-1 text-sm leading-6 text-emerald-700">{successMessage}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition ${isLoading ? 'cursor-not-allowed bg-gray-400' : 'bg-gray-900 hover:bg-black'}`}
                        >
                            {isLoading ? 'Đang gửi email...' : 'Send reset link'}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                        Chưa cần đổi mật khẩu? <Link to="/login" className="font-semibold text-gray-900 underline">Quay lại đăng nhập</Link>
                    </div>
                </section>
            </div>
        </div>
    );
};
