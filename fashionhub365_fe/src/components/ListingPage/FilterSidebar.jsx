import React, { useState } from "react";
import { CaretUp } from "../Icons";

export const FilterSidebar = () => {
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedWaist, setSelectedWaist] = useState(null);
  const [selectedClothing, setSelectedClothing] = useState(null);

  const toggleCategory = (index) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCategories(newSelected);
  };

  const categories = [
    "Everyone - All Gender Collection",
    "Accessories & Gift Cards",
    "Backpacks, Weekenders & Duffle Bags",
    "Dress Shirts & Button Downs",
    "Hoodies & Sweatshirts",
  ];

  const colorOptions = [
    { name: "Black", hex: "#1a1a1a" },
    { name: "Blue", hex: "#21558d" },
    { name: "Brown", hex: "#925c37" },
    { name: "Green", hex: "#585b45" },
    { name: "Grey", hex: "#e1e1e3" },
    { name: "Orange", hex: "#d38632" },
    { name: "Pink", hex: "#efcec9" },
    { name: "Red", hex: "#bd2830" },
    { name: "Tan", hex: "#b3a695" },
  ];

  const waistSizes = ["36", "38", "40", "42", "44", "46", "48", "50"];
  const clothingSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  return (
    <aside className="flex flex-col w-[196px] items-start gap-px relative">
      <div className="flex items-center justify-center gap-2.5 px-0 py-4 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
        <h2 className="relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          249 Products
        </h2>
      </div>
      <button className="flex items-center justify-between px-0 py-4 relative self-stretch w-full flex-[0_0_auto]">
        <h3 className="relative w-fit mt-[-1.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Category
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>
      <div className="flex flex-col gap-1.5 items-start relative self-stretch w-full">
        {categories.map((category, index) => (
          <label
            key={index}
            className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedCategories.has(index)}
              onChange={() => toggleCategory(index)}
              className="sr-only"
              aria-label={category}
            />
            <div className={`relative w-8 h-8 bg-white rounded border-[0.5px] border-solid ${selectedCategories.has(index) ? 'bg-x-600 border-x-600' : 'border-x-600'} flex items-center justify-center`}>
                 {selectedCategories.has(index) && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="mt-[-1.00px] relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              {category}
            </span>
          </label>
        ))}
      </div>
      <button className="flex items-start gap-2.5 pt-1 pb-5 px-0 relative self-stretch w-full flex-[0_0_auto]">
        <span className="flex-1 text-x-400 relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          View More +
        </span>
      </button>
      <button className="flex items-center justify-between pt-6 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
        <h3 className="font-text-300-demi text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] relative w-fit font-[number:var(--text-300-demi-font-weight)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Color
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>
      <div className="gap-4 flex-[0_0_auto] flex flex-col items-start relative self-stretch w-full">
        {[0, 1, 2].map((rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-start relative self-stretch w-full flex-[0_0_auto]"
          >
            {colorOptions.slice(rowIndex * 3, rowIndex * 3 + 3).map((color) => (
              <button
                key={color.name}
                className="flex flex-col items-center gap-2 relative flex-1 grow"
                onClick={() => setSelectedColor(color.name === selectedColor ? null : color.name)}
                aria-label={`Filter by ${color.name}`}
              >
                <div className={`relative w-6 h-6 rounded-xl border border-solid border-x-600 ${selectedColor === color.name ? 'ring-2 ring-offset-2 ring-x-600' : ''}`}>
                  <div
                    className="h-full rounded-xl"
                    style={{ backgroundColor: color.hex }}
                  />
                </div>
                <span className={`font-text-200 text-x-600 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] relative w-fit font-[number:var(--text-200-font-weight)] whitespace-nowrap [font-style:var(--text-200-font-style)] ${selectedColor === color.name ? 'font-bold' : ''}`}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <button className="flex items-start gap-2.5 pt-1 pb-5 px-0 relative self-stretch w-full flex-[0_0_auto]">
        <span className="flex-1 text-x-400 relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          View More +
        </span>
      </button>
      <button className="flex items-center justify-between pt-6 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
        <h3 className="relative w-fit font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Size
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>
      <div className="flex flex-col items-start gap-2 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto]">
        <h4 className="relative self-stretch mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-400 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          Waist
        </h4>
        {[0, 1].map((rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-start gap-1 relative self-stretch w-full flex-[0_0_auto]"
          >
            {waistSizes.slice(rowIndex * 4, rowIndex * 4 + 4).map((size) => (
              <button
                key={size}
                className={`flex items-center justify-center gap-2.5 p-3 relative flex-1 grow ${selectedWaist === size ? 'bg-black text-white' : 'bg-x-100 hover:bg-gray-200'} transition-colors duration-200`}
                onClick={() => setSelectedWaist(selectedWaist === size ? null : size)}
                aria-label={`Select waist size ${size}`}
              >
                <span className={`w-fit whitespace-nowrap relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)] ${selectedWaist === size ? 'text-white' : 'text-x-500'}`}>
                  {size}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-2 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto]">
        <h4 className="relative self-stretch mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-400 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          Clothing
        </h4>
        {[0, 1].map((rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-start gap-1 relative self-stretch w-full flex-[0_0_auto]"
          >
            {clothingSizes.slice(rowIndex * 4, rowIndex * 4 + 4).map((size) => (
              <button
                key={size}
                className={`flex items-center justify-center gap-2.5 p-3 relative flex-1 grow ${selectedClothing === size ? 'bg-black text-white' : 'bg-x-100 hover:bg-gray-200'} transition-colors duration-200`}
                onClick={() => setSelectedClothing(selectedClothing === size ? null : size)}
                aria-label={`Select clothing size ${size}`}
              >
                <span
                  className={`w-fit whitespace-nowrap relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)] ${
                    size === "XXXL" ? "ml-[-2.50px] mr-[-2.50px]" : ""
                  } ${selectedClothing === size ? 'text-white' : 'text-x-500'}`}
                >
                  {size}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
};
