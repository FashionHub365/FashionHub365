import React from "react";
import { X } from "../Icons";
import { FitFinder } from "./FitFinder";

export const SizeGuideModal = ({ isOpen, onClose, categoryName, availableSizes }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-20"
                    aria-label="Close modal"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="p-1 sm:p-4">
                    <FitFinder categoryName={categoryName} availableSizes={availableSizes} />
                </div>
            </div>
        </div>
    );
};
