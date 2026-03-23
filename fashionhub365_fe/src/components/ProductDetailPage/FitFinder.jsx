import React, { useState, useEffect } from "react";

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

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

/** Calculate base clothing size from height + weight (trả về chi tiết để giải thích) */
const calculateClothingSizeDetails = (height, weight) => {
    // Size theo cân nặng (chu vi cơ thể)
    let sizeByWeight;
    if (weight < 45)      sizeByWeight = "XS";
    else if (weight < 53) sizeByWeight = "S";
    else if (weight < 63) sizeByWeight = "M";
    else if (weight < 73) sizeByWeight = "L";
    else if (weight < 86) sizeByWeight = "XL";
    else                  sizeByWeight = "XXL";

    // Size theo chiều cao (chiều dài áo)
    let sizeByHeight;
    if (height < 155)      sizeByHeight = "XS";
    else if (height < 160) sizeByHeight = "S";
    else if (height < 168) sizeByHeight = "M";
    else if (height < 175) sizeByHeight = "L";
    else if (height < 182) sizeByHeight = "XL";
    else                   sizeByHeight = "XXL";

    const wIdx = SIZE_ORDER.indexOf(sizeByWeight);
    const hIdx = SIZE_ORDER.indexOf(sizeByHeight);
    
    // Lấy size LỚN HƠN giữa hai chiều
    return {
        size: SIZE_ORDER[Math.max(wIdx, hIdx)],
        sizeByWeight,
        sizeByHeight,
        wIdx,
        hIdx
    };
};

/**
 * Apply fit preference and filter to available sizes.
 * - fitted: pick the closest size that is >= baseSize from availableSizes
 * - oversize: bump 1 size up, then pick closest available >= that
 */
const resolveFinalSize = (baseSize, fitPreference, availableSizes) => {
    // If no restriction, bump for oversize
    if (!availableSizes || availableSizes.length === 0) {
        if (fitPreference === "oversize") {
            const idx = SIZE_ORDER.indexOf(baseSize);
            return idx !== -1 && idx < SIZE_ORDER.length - 1 ? SIZE_ORDER[idx + 1] : baseSize;
        }
        return baseSize;
    }

    // Sort available sizes by SIZE_ORDER
    const sorted = availableSizes
        .filter(s => SIZE_ORDER.includes(s))
        .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

    if (sorted.length === 0) return baseSize; // fallback

    let targetIdx = SIZE_ORDER.indexOf(baseSize);
    if (fitPreference === "oversize") targetIdx = Math.min(targetIdx + 1, SIZE_ORDER.length - 1);

    // Find closest available size >= targetIdx
    for (let i = targetIdx; i < SIZE_ORDER.length; i++) {
        if (sorted.includes(SIZE_ORDER[i])) return SIZE_ORDER[i];
    }
    // Fallback: largest available
    return sorted[sorted.length - 1];
};

const SHOE_CHART = [
    // Bổ sung các size trẻ em / size nhỏ (kids / sandals)
    { maxCm: 17.5, size: 28, eu: 28, cm: "17.0 - 17.5", usM: "10.5C", usW: "11C" },
    { maxCm: 18.0, size: 29, eu: 29, cm: "17.6 - 18.0", usM: "11.5C", usW: "12C" },
    { maxCm: 19.0, size: 30, eu: 30, cm: "18.1 - 19.0", usM: "12.5C", usW: "13C" },
    { maxCm: 19.5, size: 31, eu: 31, cm: "19.1 - 19.5", usM: "13.5C", usW: "1Y" },
    { maxCm: 20.0, size: 32, eu: 32, cm: "19.6 - 20.0", usM: "1Y",    usW: "1.5Y" },
    { maxCm: 21.0, size: 33, eu: 33, cm: "20.1 - 21.0", usM: "1.5Y",  usW: "2Y" },
    { maxCm: 21.5, size: 34, eu: 34, cm: "21.1 - 21.5", usM: "2.5Y",  usW: "3Y" },
    // Size người lớn thường dùng
    { maxCm: 22.5, size: 35, eu: 35, cm: "22.0 - 22.5", usM: "4",   usW: "5" },
    { maxCm: 23.0, size: 36, eu: 36, cm: "22.6 - 23.0", usM: "4.5", usW: "5.5" },
    { maxCm: 23.5, size: 37, eu: 37, cm: "23.1 - 23.5", usM: "5",   usW: "6" },
    { maxCm: 24.0, size: 38, eu: 38, cm: "23.6 - 24.0", usM: "5.5", usW: "7" },
    { maxCm: 24.5, size: 39, eu: 39, cm: "24.1 - 24.5", usM: "6.5", usW: "8" },
    { maxCm: 25.0, size: 40, eu: 40, cm: "24.6 - 25.0", usM: "7",   usW: "8.5" },
    { maxCm: 25.5, size: 41, eu: 41, cm: "25.1 - 25.5", usM: "8",   usW: "9.5" },
    { maxCm: 26.0, size: 42, eu: 42, cm: "25.6 - 26.0", usM: "8.5", usW: "10" },
    { maxCm: 26.5, size: 43, eu: 43, cm: "26.1 - 26.5", usM: "9.5", usW: "11" },
    { maxCm: 27.0, size: 44, eu: 44, cm: "26.6 - 27.0", usM: "10",  usW: "11.5" },
    { maxCm: 27.5, size: 45, eu: 45, cm: "27.1 - 27.5", usM: "11",  usW: "12" },
    { maxCm: 28.0, size: 46, eu: 46, cm: "27.6 - 28.0", usM: "12",  usW: "13" },
];

/** Calculate base shoe size from foot length (cm) */
const calculateShoeSize = (footLength) => {
    for (const entry of SHOE_CHART) {
        if (footLength <= entry.maxCm) return entry.size;
    }
    return 46; // fallback largest
};

/** Lọc size giày thực tế có sẵn & gần nhất với size chuẩn */
const resolveFinalShoeSize = (baseSizeStr, availableSizes) => {
    if (!availableSizes || availableSizes.length === 0) return String(baseSizeStr);
    const baseSize = parseInt(baseSizeStr, 10);

    // Lọc ra các size số
    const numericSizes = availableSizes
        .map(s => parseInt(s, 10))
        .filter(s => !isNaN(s))
        .sort((a, b) => a - b);

    if (numericSizes.length === 0) return String(baseSizeStr);

    for (const size of numericSizes) {
        if (size >= baseSize) return String(size);
    }
    // Không có size lớn hơn hoặc bằng → Lấy size to nhất có thể
    return String(numericSizes[numericSizes.length - 1]);
};

const CLOTHING_CHART = [
    { size: "XS",  chest: "78–83",   waist: "60–65", hip: "84–89",   height: "< 155",   weight: "< 45" },
    { size: "S",   chest: "84–89",   waist: "66–71", hip: "90–95",   height: "155–160", weight: "45–52" },
    { size: "M",   chest: "90–95",   waist: "72–77", hip: "96–101",  height: "160–168", weight: "53–62" },
    { size: "L",   chest: "96–101",  waist: "78–83", hip: "102–107", height: "168–175", weight: "63–72" },
    { size: "XL",  chest: "102–107", waist: "84–89", hip: "108–113", height: "175–182", weight: "73–85" },
    { size: "XXL", chest: "108–113", waist: "90–95", hip: "114–119", height: "> 182",   weight: "> 85" },
];

/**
 * FitFinder component
 * @param {string}   categoryName    - Used to auto-detect tab (clothing vs shoes)
 * @param {string[]} availableSizes  - Sizes this product actually has (e.g. ["S","M","L","XL"])
 */
export const FitFinder = ({ categoryName, availableSizes = [] }) => {
    const productType = detectProductType(categoryName);
    const isShoes = productType === CATEGORY_TYPES.SHOES;

    // Clothing state
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [fitPreference, setFitPreference] = useState("fitted");

    // Shoes state
    const [footLength, setFootLength] = useState("");

    // Shared
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState(isShoes ? "shoes" : "clothing");

    // Sync tab when product changes (e.g. navigation between products)
    useEffect(() => {
        setActiveTab(isShoes ? "shoes" : "clothing");
        setResult(null);
    }, [isShoes]);

    const handleCalculate = (e) => {
        e.preventDefault();
        if (activeTab === "shoes") {
            const fl = parseFloat(footLength);
            if (!fl || fl < 15 || fl > 35) return;
            const baseSizeNum = calculateShoeSize(fl);
            const baseSizeStr = String(baseSizeNum);
            const finalSize = resolveFinalShoeSize(baseSizeStr, availableSizes);

            let insightMsg = "";
            let insightType = "balanced";
            if (baseSizeStr !== finalSize && availableSizes.length > 0) {
                const finalNum = parseInt(finalSize, 10);
                if (finalNum > baseSizeNum) {
                    insightType = "balanced";
                    insightMsg = `Chân bạn chuẩn size ${baseSizeStr}, nhưng hiện cửa hàng chỉ còn ${finalSize} (rộng hơn 1 chút). Bạn lưu ý có thể thêm lót giày hoặc mang tất dày thì đi vẫn thoải mái nhé!`;
                } else {
                    insightType = "height-dominant"; 
                    insightMsg = `Cỡ chân bạn chuẩn với size ${baseSizeStr}, nhưng size lớn nhất cửa hàng đang có là ${finalSize}. Giày có thể sẽ hơi kích, bạn cân nhắc nha!`;
                }
            } else {
                insightMsg = `Chiều dài chân ${fl}cm cực kỳ vừa vặn và chuẩn form với size ${baseSizeStr} (EU)!`;
            }

            setResult({ 
                type: "shoes", 
                size: finalSize, 
                baseSize: baseSizeStr, 
                footLength: fl,
                insightMsg,
                insightType
            });
        } else {
            const h = parseFloat(height);
            const w = parseFloat(weight);
            if (!h || !w) return;
            const details = calculateClothingSizeDetails(h, w);
            const baseSize = details.size;
            const finalSize = resolveFinalSize(baseSize, fitPreference, availableSizes);
            
            // Generate insight message for body proportion
            let insightMsg = "";
            let insightType = "balanced"; // balanced, weight-dominant, height-dominant
            if (details.wIdx > details.hIdx) {
                insightType = "weight-dominant";
                insightMsg = `Theo cân nặng bạn thuộc size ${details.sizeByWeight}, trong khi chiều cao là size ${details.sizeByHeight}. Hệ thống gợi ý chọn theo cân nặng để các vòng (ngực/eo) không bị ép chật, dù áo/quần có thể hơi dài một chút.`;
            } else if (details.hIdx > details.wIdx) {
                insightType = "height-dominant";
                insightMsg = `Theo chiều cao bạn mặc size ${details.sizeByHeight}, nhưng cân nặng ở size ${details.sizeByWeight}. Hệ thống gợi ý chọn theo chiều cao để bề dài áo/quần đủ che phủ cơ thể, không bị cộc cụt cỡn.`;
            } else {
                insightMsg = `Chỉ số chiều cao và cân nặng của bạn rất cân đối, vừa vặn với chuẩn size ${baseSize}.`;
            }

            setResult({ 
                type: "clothing", 
                size: finalSize, 
                baseSize, 
                fitPreference,
                insightMsg,
                insightType
            });
        }
    };

    // Filter clothing chart to only show sizes the product has (if info available)
    const chartRows = availableSizes.length > 0
        ? CLOTHING_CHART.filter(row => availableSizes.includes(row.size))
        : CLOTHING_CHART;

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

            <form onSubmit={handleCalculate} className="flex flex-col gap-5">
                {activeTab === "clothing" ? (
                    <>
                        {/* Height & Weight */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="ff-height">
                                    Chiều Cao (cm)
                                </label>
                                <input
                                    id="ff-height"
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="VD: 175"
                                    className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-bold"
                                    required
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="ff-weight">
                                    Cân Nặng (kg)
                                </label>
                                <input
                                    id="ff-weight"
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="VD: 68"
                                    className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-bold"
                                    required
                                />
                            </div>
                        </div>

                        {/* Fit Preference */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Phong Cách Mặc
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setFitPreference("fitted"); setResult(null); }}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 px-4 rounded-xl border-2 transition-all font-bold text-sm
                                        ${fitPreference === "fitted"
                                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                                        }`}
                                >
                                    <span className="text-xl">🧍</span>
                                    <span>Vừa Vặn</span>
                                    <span className={`text-[11px] font-normal leading-tight text-center ${fitPreference === "fitted" ? "text-gray-300" : "text-gray-400"}`}>
                                        Ôm sát, đúng form dáng
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setFitPreference("oversize"); setResult(null); }}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 px-4 rounded-xl border-2 transition-all font-bold text-sm
                                        ${fitPreference === "oversize"
                                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                                        }`}
                                >
                                    <span className="text-xl">🧥</span>
                                    <span>Oversize</span>
                                    <span className={`text-[11px] font-normal leading-tight text-center ${fitPreference === "oversize" ? "text-gray-300" : "text-gray-400"}`}>
                                        Rộng thoải mái, lên 1 size
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full md:w-auto self-start px-10 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform active:scale-95 shadow-lg shadow-gray-200"
                        >
                            Tính Ngay
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" htmlFor="ff-footLength">
                                Chiều Dài Bàn Chân (cm)
                            </label>
                            <input
                                id="ff-footLength"
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

                        <button
                            type="submit"
                            className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform active:scale-95 shadow-lg shadow-gray-200"
                        >
                            Tính Ngay
                        </button>
                    </div>
                )}
            </form>

            {/* Result */}
            {result && (
                <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100 shrink-0">
                            <span className="text-white font-bold text-xl">✓</span>
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-bold uppercase tracking-wider">Gợi ý dành cho bạn</p>
                            {result.type === "shoes" ? (
                                <p className="text-2xl font-black text-green-900">
                                    Size {result.size} (EU) là sự lựa chọn tốt nhất!
                                </p>
                            ) : (
                                <>
                                    <p className="text-2xl font-black text-green-900">
                                        Size {result.size} là sự lựa chọn tốt nhất!
                                    </p>
                                    
                                    {/* Body Proportion Insight */}
                                    {result.insightMsg && (
                                        <div className="mt-3 py-2 px-3 bg-white/50 rounded-lg border border-green-200/50 text-xs text-green-800 leading-relaxed font-medium">
                                            <span className="mr-1 inline-block">
                                                {result.insightType === "weight-dominant" ? "⚖️" : result.insightType === "height-dominant" ? "📏" : "✨"}
                                            </span>
                                            {result.insightMsg}
                                        </div>
                                    )}

                                    {/* Preference Adjustments */}
                                    {result.fitPreference === "oversize" && result.baseSize !== result.size && (
                                        <p className="text-xs text-green-700 mt-2 font-medium">
                                            ✦ Đã tăng 1 size so với gợi ý ({result.baseSize}) theo phong cách Oversize
                                        </p>
                                    )}
                                    {result.fitPreference === "oversize" && result.baseSize === result.size && (
                                        <p className="text-xs text-green-700 mt-2 font-medium">
                                            ✦ Đây đã là size lớn nhất có sẵn của sản phẩm này, không thể tăng size thêm
                                        </p>
                                    )}
                                    {availableSizes.length > 0 && (
                                        <p className="text-xs text-green-700/80 mt-1 font-medium italic">
                                            Sản phẩm tại cửa hàng đang có: {availableSizes.join(", ")}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block text-green-100 opacity-20 transform rotate-12 shrink-0">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Clothing reference table */}
            {activeTab === "clothing" && (
                <div className="mt-6 overflow-x-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Bảng Tham Khảo Size Quần Áo (cm)
                        {availableSizes.length > 0 && (
                            <span className="ml-2 normal-case font-normal text-blue-500">
                                — chỉ hiển thị size sản phẩm có
                            </span>
                        )}
                    </p>
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Size</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Ngực (cm)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Eo (cm)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Hông (cm)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Cao (cm)</th>
                                <th className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Nặng (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartRows.map((row) => {
                                const isFinalSize = result?.type === "clothing" && result.size === row.size;
                                const isBaseBeforeOversize =
                                    result?.type === "clothing" &&
                                    result.fitPreference === "oversize" &&
                                    result.baseSize === row.size &&
                                    result.baseSize !== result.size;
                                return (
                                    <tr
                                        key={row.size}
                                        className={`transition-colors
                                            ${isFinalSize ? "bg-green-50 font-bold" : ""}
                                            ${isBaseBeforeOversize ? "bg-yellow-50" : ""}
                                            ${!isFinalSize && !isBaseBeforeOversize ? "hover:bg-blue-50" : ""}
                                        `}
                                    >
                                        <td className={`px-3 py-1.5 border border-gray-200 font-black text-base
                                            ${isFinalSize ? "text-green-700" : isBaseBeforeOversize ? "text-yellow-600" : "text-gray-800"}`}>
                                            {row.size}
                                            {isFinalSize && <span className="ml-1 text-green-500 text-xs">✓</span>}
                                            {isBaseBeforeOversize && <span className="ml-1 text-yellow-500 text-xs">→</span>}
                                        </td>
                                        <td className="px-3 py-1.5 border border-gray-200">{row.chest}</td>
                                        <td className="px-3 py-1.5 border border-gray-200">{row.waist}</td>
                                        <td className="px-3 py-1.5 border border-gray-200">{row.hip}</td>
                                        <td className="px-3 py-1.5 border border-gray-200">{row.height}</td>
                                        <td className="px-3 py-1.5 border border-gray-200">{row.weight}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-2">
                        💡 <strong>Vừa vặn:</strong> chọn đúng size theo số đo. <strong>Oversize:</strong> lên 1 size để mặc thụng, thoải mái hơn.
                    </p>
                </div>
            )}

            {/* Shoe reference table */}
            {activeTab === "shoes" && (() => {
                const shoeChartRows = availableSizes.length > 0
                    ? SHOE_CHART.filter(row => availableSizes.includes(String(row.eu)))
                    : SHOE_CHART;

                return (
                <div className="mt-6 overflow-x-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Bảng tham khảo size giày (EU/VN)
                        {availableSizes.length > 0 && (
                            <span className="ml-2 normal-case font-normal text-blue-500">
                                — chỉ hiển thị size sản phẩm có
                            </span>
                        )}
                    </p>
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
                            {shoeChartRows.map((row) => {
                                const isFinalSize = result?.type === "shoes" && result.size === String(row.eu);
                                const isBaseBeforeAdjust =
                                    result?.type === "shoes" &&
                                    result.baseSize === String(row.eu) &&
                                    result.baseSize !== result.size;

                                return (
                                <tr
                                    key={row.eu}
                                    className={`transition-colors
                                        ${isFinalSize ? "bg-green-50 font-bold" : ""}
                                        ${isBaseBeforeAdjust ? "bg-yellow-50" : ""}
                                        ${!isFinalSize && !isBaseBeforeAdjust ? "hover:bg-blue-50" : ""}
                                    `}
                                >
                                    <td className="px-3 py-1.5 border border-gray-200">{row.cm}</td>
                                    <td className={`px-3 py-1.5 border border-gray-200 font-black text-base
                                        ${isFinalSize ? "text-green-700" : isBaseBeforeAdjust ? "text-yellow-600" : "text-gray-800"}`}>
                                        {row.eu}
                                        {isFinalSize && <span className="ml-1 text-green-500 text-xs">✓</span>}
                                        {isBaseBeforeAdjust && <span className="ml-1 text-yellow-500 text-xs">→</span>}
                                    </td>
                                    <td className="px-3 py-1.5 border border-gray-200">{row.usM}</td>
                                    <td className="px-3 py-1.5 border border-gray-200">{row.usW}</td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )})()}
        </div>
    );
};
