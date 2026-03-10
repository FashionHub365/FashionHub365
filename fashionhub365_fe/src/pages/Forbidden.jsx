import React from "react";
import { Link } from "react-router-dom";

export const Forbidden = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-red-50 text-red-500">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                403 - Truy cập bị từ chối
            </h1>
            <p className="mb-8 text-lg text-gray-500 max-w-[600px]">
                Bạn không có quyền truy cập vào trang này. Vui lòng đảm bảo rằng bạn đã đăng nhập với tài khoản có đủ thẩm quyền.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    to="/"
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white transition-colors bg-black rounded-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                    Về Trang Chủ
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );
};

export default Forbidden;
