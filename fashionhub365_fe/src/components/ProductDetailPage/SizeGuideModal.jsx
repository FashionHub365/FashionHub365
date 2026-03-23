import React from "react";
import { X } from "../Icons";

export const SizeGuideModal = ({ isOpen, onClose, productType = "Top" }) => {
    if (!isOpen) return null;

    const sizeData = {
        Top: [
            { size: "XS", chest: "32-34", waist: "26-28", hip: "32-34" },
            { size: "S", chest: "35-37", waist: "29-31", hip: "35-37" },
            { size: "M", chest: "38-40", waist: "32-34", hip: "38-40" },
            { size: "L", chest: "41-43", waist: "35-37", hip: "41-43" },
            { size: "XL", chest: "44-46", waist: "38-40", hip: "44-46" },
        ],
        Bottom: [
            { size: "28", waist: "28", hip: "34", length: "30" },
            { size: "30", waist: "30", hip: "36", length: "30" },
            { size: "32", waist: "32", hip: "38", length: "32" },
            { size: "34", waist: "34", hip: "40", length: "32" },
            { size: "36", waist: "36", hip: "42", length: "34" },
        ],
    };

    const currentData = sizeData[productType] || sizeData.Top;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900">Bảng Hướng Dẫn Kích Cỡ</h2>
                    <p className="text-gray-500 mb-8 font-medium">Toàn bộ thông số tính theo đơn vị Inches (1 inch = 2.54 cm)</p>

                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 font-bold text-gray-900 uppercase tracking-wider text-xs">Kích Cỡ</th>
                                    {Object.keys(currentData[0]).filter(k => k !== 'size').map(key => (
                                        <th key={key} className="px-6 py-4 font-bold text-gray-900 uppercase tracking-wider text-xs">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentData.map((row) => (
                                    <tr key={row.size} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{row.size}</td>
                                        {Object.entries(row).filter(([k]) => k !== 'size').map(([key, value]) => (
                                            <td key={key} className="px-6 py-4 text-gray-600 font-medium">{value}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 bg-blue-50/50 p-6 rounded-xl flex items-start gap-4 border border-blue-100">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                            <span className="text-white font-bold text-lg">!</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 mb-1">Cách đo đạt thông số chuẩn xác</h4>
                            <p className="text-blue-700/80 text-sm leading-relaxed">
                                Nên đo sát vào cơ thể bằng thước dây mềm. Phối hợp với công cụ <b>Tư Vấn Size (Fit Finder)</b> của chúng tôi để có gợi ý tốt nhất dựa trên vóc dáng của bạn.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
