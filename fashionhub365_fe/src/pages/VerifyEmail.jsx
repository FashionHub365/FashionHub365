import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../apis/authApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_STYLES = {
    verifying: {
        title: 'Verifying your email',
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    success: {
        title: 'Email verified',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    error: {
        title: 'Verification failed',
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
    },
};

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Checking your verification token...');
    const [email, setEmail] = useState('');
    const [resendError, setResendError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');
    const [sending, setSending] = useState(false);

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
                setMessage('Your email has been verified successfully. You can continue to sign in.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error?.message || error.response?.data?.message || 'Verification failed. The link may be expired.');
            }
        };

        verify();
    }, [searchParams]);

    const handleResend = async (e) => {
        e.preventDefault();
        setResendError('');
        setResendSuccess('');

        if (!email.trim()) {
            setResendError('Please enter your email.');
            return;
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            setResendError('Please enter a valid email address.');
            return;
        }

        setSending(true);
        try {
            const response = await authApi.sendVerificationEmail(email.trim());
            if (response.success) {
                setResendSuccess(response.data?.message || 'If that email exists, a verification link has been sent.');
            }
        } catch (error) {
            setResendError(error.response?.data?.error?.message || error.response?.data?.message || 'Unable to send verification email.');
        } finally {
            setSending(false);
        }
    };

    const currentStyle = useMemo(() => STATUS_STYLES[status] || STATUS_STYLES.error, [status]);

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#f3f4f6_0%,#ffffff_40%,#eef7f5_100%)] px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">Email Verification</p>
                    <h1 className="mt-3 text-3xl font-black text-gray-900">{currentStyle.title}</h1>
                    <p className="mt-3 text-sm leading-6 text-gray-500">
                        Confirming your email helps secure the account and unlocks the full buyer experience on FashionHub365.
                    </p>

                    <div className={`mt-6 rounded-2xl border p-4 ${currentStyle.tone}`}>
                        <p className="text-sm font-semibold">{message}</p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                        >
                            Go to login
                        </button>
                        <Link
                            to="/register"
                            className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Create another account
                        </Link>
                    </div>
                </section>

                <section className="rounded-[32px] border border-stone-200 bg-stone-900 p-8 text-white shadow-[0_30px_80px_rgba(17,24,39,0.18)] sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-400">Need A New Email?</p>
                    <h2 className="mt-4 text-4xl font-black leading-tight">Resend the verification link with a proper form.</h2>
                    <p className="mt-4 text-sm leading-7 text-stone-300">
                        If the link expired or never arrived, enter your email below and we will send a fresh verification email.
                    </p>

                    <form onSubmit={handleResend} className="mt-8 space-y-4">
                        <div>
                            <label htmlFor="resend-email" className="mb-2 block text-sm font-semibold text-stone-200">
                                Email address
                            </label>
                            <input
                                id="resend-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (resendError) setResendError('');
                                    if (resendSuccess) setResendSuccess('');
                                }}
                                placeholder="name@example.com"
                                className={`w-full rounded-2xl border px-4 py-3.5 text-white outline-none transition ${resendError ? 'border-rose-400 bg-rose-500/10' : 'border-white/15 bg-white/5 focus:border-white/40'}`}
                            />
                        </div>

                        {resendError && <p className="text-sm font-medium text-rose-300">{resendError}</p>}
                        {resendSuccess && <p className="text-sm font-medium text-emerald-300">{resendSuccess}</p>}

                        <button
                            type="submit"
                            disabled={sending}
                            className={`w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${sending ? 'cursor-not-allowed bg-stone-500 text-stone-200' : 'bg-white text-stone-900 hover:bg-stone-100'}`}
                        >
                            {sending ? 'Sending verification email...' : 'Resend verification email'}
                        </button>
                    </form>

                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-stone-300">
                        Tip: check both your inbox and spam folder. The verification email is usually delivered within a few minutes.
                    </div>
                </section>
            </div>
        </div>
    );
};

export default VerifyEmail;
