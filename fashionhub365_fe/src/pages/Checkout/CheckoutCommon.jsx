import React, { useState, useEffect, useRef } from "react";

// ── Step indicator ────────────────────────────────────────────────────
export const StepBar = ({ step }) => (
    <div className="flex items-center justify-center gap-0 mb-10">
        {["Cart", "Shipping", "Review & Pay"].map((label, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
                <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done ? "bg-black text-white" : active ? "bg-x-600 text-white" : "bg-gray-200 text-gray-400"}`}
                        >
                            {done ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : idx}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-x-600" : done ? "text-black" : "text-gray-400"}`}>
                            {label}
                        </span>
                    </div>
                    {i < 2 && (
                        <div className={`h-0.5 w-16 mx-1 mb-5 transition-all ${done ? "bg-black" : "bg-gray-200"}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ── Input component ───────────────────────────────────────────────────
export const Field = ({ label, id, required, error, ...props }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            id={id}
            className={`w-full px-4 py-3 border text-sm font-text-200 outline-none transition-all
        ${error ? "border-red-400 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-x-600 focus:ring-1 focus:ring-x-600/20"}`}
            {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// ── Highlight matching text ───────────────────────────────────────────
export const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 text-gray-900 font-semibold not-italic rounded-sm px-[1px]">{part}</mark>
                    : <span key={i}>{part}</span>
            )}
        </>
    );
};

// ── Searchable Dropdown component ─────────────────────────────────────
export const SearchableSelect = ({ label, id, required, error, loading, disabled, options, value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (optName) => {
        onChange(optName);
        setOpen(false);
        setSearch("");
    };

    const handleToggle = () => {
        if (disabled || loading) return;
        setOpen((prev) => !prev);
        if (!open) setSearch("");
    };

    return (
        <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            <button
                id={id}
                type="button"
                onClick={handleToggle}
                disabled={disabled || loading}
                className={`w-full px-4 py-3 border text-sm text-left flex items-center justify-between gap-2 outline-none transition-all select-none
                    ${disabled || loading ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white cursor-pointer hover:border-gray-400"}
                    ${error ? "border-red-400 bg-red-50" : open ? "border-x-600 ring-1 ring-x-600/20" : "border-gray-300"}
                    ${!value ? "text-gray-400" : "text-gray-900"}`}
            >
                <span className="truncate flex-1">{value || placeholder}</span>
                <span className="flex-shrink-0">
                    {loading ? (
                        <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </span>
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 shadow-2xl overflow-hidden"
                    style={{ minWidth: "100%" }}>

                    <div className="p-2 border-b border-gray-100 bg-gray-50/80">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-sm focus-within:border-x-600 focus-within:ring-1 focus-within:ring-x-600/20 transition-all">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Tìm nhanh ${label.toLowerCase()}...`}
                                className="w-full text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filtered.length === 1) handleSelect(filtered[0].name);
                                    if (e.key === "Escape") { setOpen(false); setSearch(""); }
                                }}
                            />
                        </div>
                    </div>

                    <ul className="max-h-52 overflow-y-auto overscroll-contain">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-400 text-center">
                                Không tìm thấy kết quả
                            </li>
                        ) : (
                            filtered.map((opt) => (
                                <li
                                    key={opt.code}
                                    onClick={() => handleSelect(opt.name)}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 group
                                        ${value === opt.name
                                            ? "bg-x-600/8 text-x-600 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                    <span className="flex-1 truncate">
                                        {search ? <HighlightText text={opt.name} highlight={search} /> : opt.name}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};
