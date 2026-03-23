import React, { useState } from "react";

const CATEGORY_TYPES = {
    CLOTHING: "clothing",
    SHOES: "shoes",
};

/** Detect product type from category name */
const detectProductType = (categoryName) => {
    if (!categoryName) return CATEGORY_TYPES.CLOTHING;
    const lower = categoryName.toLowerCase();
    const shoeKeywords = [
        "shoe", "shoes", "giày", "giầy", "dép", "sandal", "sneaker", "boot", "slipper",
        "footwear", "loafer", "heel", "flat", "mule", "clog", "flip-flop",
    ];
    if (shoeKeywords.some((kw) => lower.includes(kw))) return CATEGORY_TYPES.SHOES;
    return CATEGORY_TYPES.CLOTHING;
};

/** Calculate clothing size from height + weight */
const calculateClothingSize = (height, weight) => {
    if (height < 160 && weight < 50) return "XS";
    if (height < 165 && weight < 55) return "S";
    if (height < 175 && weight < 75) return "M";
    if (height < 185 && weight < 85) return "L";
    if (height < 190 && weight < 95) return "XL";
    return "XXL";
};

/** Calculate shoe size from foot length (cm) → VN/EU size */
const calculateShoeSize = (footLength) => {
    // Standard EU/VN size chart based on foot length in cm
    const chart = [
        { maxCm: 22.5, size: 35 },
        { maxCm: 23.0, size: 36 },
        { maxCm: 23.5, size: 37 },
        { maxCm: 24.0, size: 38 },
        { maxCm: 24.5, size: 39 },
        { maxCm: 25.0, size: 40 },
        { maxCm: 25.5, size: 41 },
        { maxCm: 26.0, size: 42 },
        { maxCm: 26.5, size: 43 },
        { maxCm: 27.0, size: 44 },
        { maxCm: 27.5, size: 45 },
        { maxCm: 28.0, size: 46 },
    ];
    for (const entry of chart) {
        if (footLength <= entry.maxCm) return entry.size;
    }
    return 46;
};

export const FitFinder = ({ categoryName }) => {
    const productType = detectProductType(categoryName);
    const isShoes = productType === CATEGORY_TYPES.SHOES;

    // Clothing state
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");

    // Shoes state
    const [footLength, setFootLength] = useState("");

    // Shared
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState(isShoes ? "shoes" : "clothing");

    const handleCalculate = (e) => {
        e.preventDefault();
        if (activeTab === "shoes") {
            const fl = parseFloat(footLength);
            if (!fl || fl < 15 || fl > 35) return;
            const shoeSize = calculateShoeSize(fl);
            setResult({ type: "shoes", size: shoeSize, footLength: fl });
        } else {
            const h = parseFloat(height);
            const w = parseFloat(weight);
            if (!h || !w) return;
            const clothingSize = calculateClothingSize(h, w);
            setResult({ type: "clothing", size: clothingSize });
        }
    };

    return (
        <div className="mt-8 p-8 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Tìm Kích Cỡ Của Bạn (Fit Finder)</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Nhập thông số để chúng tôi gợi ý size phù hợp nhất.</p>

            {/* Tab switcher */}
            <div className="flex mb-6 bg-gray-200 rounded-xl p-1 gap-1">
                <button
                    type="button"
                    onClick={() => { setActiveTab("clothing"); setResult(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "clothing"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    👕 Quần áo
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab("shoes"); setResult(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "shoes"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    👟 Giày dép
                </button>
            </div>

            <form onSubmit={handleCalculate} className="flex flex-col md:flex-row gap-6 items-end">
                {activeTab === "clothing" ? (
                    <>
                        <div className="flex-1 w-full translate-y-[-1px]">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="height">
                                Chiều Cao (cm)
                            </label>
                            <input
                                id="height"
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="VD: 175"
                                className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-bold"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="weight">
                                Cân Nặng (kg)
                            </label>
                            <input
                                id="weight"
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="VD: 68"
                                className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-bold"
                                required
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="footLength">
                            Chiều Dài Bàn Chân (cm)
                        </label>
                        <input
                            id="footLength"
                            type="number"
                            step="0.1"
                            value={footLength}
                            onChange={(e) => setFootLength(e.target.value)}
                            placeholder="VD: 25.5"
                            className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-bold"
                            required
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            💡 Đặt chân lên giấy, đánh dấu gót và ngón dài nhất, rồi đo khoảng cách.
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform active:scale-95 shadow-lg shadow-gray-200"
                >
                    Tính Ngay
                </button>
            </form>

            {/* Result */}
            {result && (
                <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                            <span className="text-white font-bold text-xl">✓</span>
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-bold uppercase tracking-wider">Gợi ý dành cho bạn</p>
                            {result.type === "shoes" ? (
                                <p className="text-2xl font-black text-green-900">
                                    Size {result.size} (EU) là sự lựa chọn tốt nhất!
                                </p>
                            ) : (
                                <p className="text-2xl font-black text-green-900">
                                    Size {result.size} là sự lựa chọn tốt nhất!
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block text-green-100 opacity-20 transform rotate-12">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                </div>
            )}

            {/* Shoe size reference table */}
            {activeTab === "shoes" && (
                <div className="mt-6 overflow-x-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bảng tham khảo size giày (EU/VN)</p>
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Dài chân (cm)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Size EU</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Size US (Nam)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Size US (Nữ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { cm: "22.5", eu: 35, usM: 4, usW: 5 },
                                { cm: "23.0", eu: 36, usM: 4.5, usW: 5.5 },
                                { cm: "23.5", eu: 37, usM: 5, usW: 6 },
                                { cm: "24.0", eu: 38, usM: 5.5, usW: 7 },
                                { cm: "24.5", eu: 39, usM: 6.5, usW: 8 },
                                { cm: "25.0", eu: 40, usM: 7, usW: 8.5 },
                                { cm: "25.5", eu: 41, usM: 8, usW: 9.5 },
                                { cm: "26.0", eu: 42, usM: 8.5, usW: 10 },
                                { cm: "26.5", eu: 43, usM: 9.5, usW: 11 },
                                { cm: "27.0", eu: 44, usM: 10, usW: 11.5 },
                                { cm: "27.5", eu: 45, usM: 11, usW: 12 },
                                { cm: "28.0", eu: 46, usM: 12, usW: 13 },
                            ].map((row) => (
                                <tr key={row.eu} className={`hover:bg-blue-50 transition-colors ${result?.type === "shoes" && result.size === row.eu ? "bg-green-50 font-bold" : ""}`}>
                                    <td className="px-3 py-1.5 border border-gray-200">{row.cm}</td>
                                    <td className="px-3 py-1.5 border border-gray-200 font-semibold">{row.eu}</td>
                                    <td className="px-3 py-1.5 border border-gray-200">{row.usM}</td>
                                    <td className="px-3 py-1.5 border border-gray-200">{row.usW}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
