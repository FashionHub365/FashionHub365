import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export const NotFound = () => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const suggestions = [
        { label: "New Arrivals", path: "/" },
        { label: "Men", path: "/men" },
        { label: "Stores", path: "/stores" },
        { label: "About", path: "/about" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 font-sans overflow-hidden relative">
            {/* Decorative blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-indigo-900 opacity-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full bg-purple-900 opacity-20 blur-3xl pointer-events-none" />

            {/* Card */}
            <div
                className={`relative z-10 w-full max-w-2xl text-center transition-all duration-700 ease-out ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
            >
                {/* Brand */}
                <Link
                    to="/"
                    className="inline-block mb-10 text-sm tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors duration-300"
                >
                    FashionHub365
                </Link>

                {/* Giant 404 */}
                <div className="relative select-none mb-6">
                    <span
                        className="text-[clamp(120px,22vw,200px)] font-bold leading-none tracking-tighter text-transparent bg-clip-text"
                        style={{
                            backgroundImage:
                                "linear-gradient(135deg, #e0e0e0 0%, #8a8a8a 40%, #3a3a3a 100%)",
                        }}
                    >
                        404
                    </span>
                    {/* Hanger icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg
                            className="w-24 h-24 text-white opacity-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M20.86 18.26 13 10.39V9a1 1 0 000-2h-.17A3 3 0 006 8a1 1 0 002 0 1 1 0 011-1 1 1 0 011 1v2.39l-7.86 7.87A2 2 0 003.55 21h16.9a2 2 0 001.41-3.74z" />
                        </svg>
                    </div>
                </div>

                {/* Thin divider */}
                <div className="w-16 h-px bg-gray-600 mx-auto mb-8" />

                <h1 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-wide">
                    Page not found
                </h1>
                <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
                    Looks like this page went out of style. Let's get you back to
                    something fabulous.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 text-sm tracking-widest uppercase font-medium hover:bg-gray-100 transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m-4 0H9"
                            />
                        </svg>
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-600 text-gray-300 text-sm tracking-widest uppercase font-medium hover:border-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Go Back
                    </button>
                </div>

                {/* Quick links */}
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-5">
                        You might be looking for
                    </p>
                    <nav className="flex flex-wrap items-center justify-center gap-3">
                        {suggestions.map(({ label, path }) => (
                            <Link
                                key={label}
                                to={path}
                                className="px-5 py-2 rounded-full text-sm text-gray-400 border border-gray-700 hover:border-gray-400 hover:text-white transition-all duration-200 hover:bg-white hover:bg-opacity-5"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Bottom brand badge */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-xs text-gray-700 tracking-widest uppercase">
                    © {new Date().getFullYear()} FashionHub365
                </p>
            </div>
        </div>
    );
};
