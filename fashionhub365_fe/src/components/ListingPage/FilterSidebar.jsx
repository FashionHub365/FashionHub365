  import React, { useState, useEffect } from "react";
import { CaretUp } from "../Icons";
import listingApi from "../../apis/listingApi";

const COLOR_MAP = {
  black: "#1a1a1a",
  white: "#ffffff",
  blue: "#21558d",
  brown: "#925c37",
  green: "#585b45",
  grey: "#e1e1e3",
  gray: "#e1e1e3",
  orange: "#d38632",
  pink: "#efcec9",
  red: "#bd2830",
  tan: "#b3a695",
  navy: "#1b2a4a",
  beige: "#f5e6c8",
  yellow: "#f5c842",
  purple: "#6b2fa0",
  "đen": "#1a1a1a",
  "trắng": "#ffffff",
  "xám": "#e1e1e3",
  "be": "#f5e6c8",
  "collegiate green": "#1b4f23",
  "black/white": "linear-gradient(135deg, #1a1a1a 50%, #ffffff 50%)",
  "white/green": "linear-gradient(135deg, #ffffff 50%, #585b45 50%)",
};

function getColorHex(colorName) {
  if (!colorName) return "#cccccc";
  return COLOR_MAP[colorName.toLowerCase()] || "#cccccc";
}

/**
 * FilterSidebar - Thanh lọc sản phẩm
 * - Lấy categories từ API thực
 * - Gọi onFilterChange khi người dùng chọn filter để ProductGridSection fetch lại
 * - Đồng bộ trạng thái filter từ URL query params (activeFilters)
 */
export const FilterSidebar = ({ onFilterChange, activeFilters = {} }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedWaist, setSelectedWaist] = useState(null);

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  // Lấy danh sách categories và options từ API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, optRes] = await Promise.all([
          listingApi.getCategories(),
          listingApi.getFilterOptions()
        ]);
        
        if (catRes.success) {
          setCategories(catRes.data);
        }
        
        if (optRes.success) {
          setColors(optRes.data.colors.map(name => ({ name, hex: getColorHex(name) })));
          setSizes(optRes.data.sizes);
        }
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };
    fetchOptions();
  }, []);

  const waistSizes = sizes.filter(s => !isNaN(parseInt(s)));
  const clothingSizes = sizes.filter(s => isNaN(parseInt(s)));

  /**
   * Đồng bộ trạng thái sidebar khi activeFilters thay đổi (từ URL params)
   */
  useEffect(() => {
    // Sync khi category thay đổi từ URL (navigate từ Landing page)
    if (activeFilters.category) {
      setSelectedCategories(new Set([activeFilters.category]));
    } else {
      setSelectedCategories(new Set());
    }

    // Sync color
    setSelectedColor(activeFilters.color || null);

    // Sync size
    if (activeFilters.size) {
      if (waistSizes.includes(activeFilters.size)) {
        setSelectedWaist(activeFilters.size);
        setSelectedSize(null);
      } else {
        setSelectedSize(activeFilters.size);
        setSelectedWaist(null);
      }
    } else {
      setSelectedSize(null);
      setSelectedWaist(null);
    }
  }, [activeFilters.category, activeFilters.color, activeFilters.size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi category thay đổi – gửi slug của category đầu tiên được chọn lên parent
  const toggleCategory = (slug) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedCategories(newSelected);

    // Gửi lên parent: filter theo category slug đầu tiên (mở rộng sau nếu cần multi-select)
    const firstSlug = newSelected.size > 0 ? [...newSelected][0] : "";
    onFilterChange({ category: firstSlug });
  };

  // Khi chọn màu
  const handleColorSelect = (colorName) => {
    const newColor = selectedColor === colorName ? null : colorName;
    setSelectedColor(newColor);
    onFilterChange({ color: newColor || "" });
  };

  // Khi chọn size clothing
  const handleSizeSelect = (size) => {
    const newSize = selectedSize === size ? null : size;
    setSelectedSize(newSize);
    onFilterChange({ size: newSize || "" });
  };

  // Khi chọn waist size
  const handleWaistSelect = (size) => {
    const newWaist = selectedWaist === size ? null : size;
    setSelectedWaist(newWaist);
    onFilterChange({ size: newWaist || "" });
  };

  return (
    <aside className="flex flex-col w-full items-start gap-px relative">
      {/* Header: tổng sản phẩm được hiển thị ở ListingHeader */}
      <div className="flex items-center justify-center gap-2.5 px-0 py-4 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
        <h2 className="relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          Filters
        </h2>
      </div>

      {/* Category Filter */}
      <button className="flex items-center justify-between px-0 py-4 relative self-stretch w-full flex-[0_0_auto]">
        <h3 className="relative w-fit mt-[-1.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Category
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>
      <div className="flex flex-col gap-1.5 items-start relative self-stretch w-full">
        {categories.length === 0 ? (
          <p className="font-text-200 text-x-300 text-[length:var(--text-200-font-size)]">
            Loading...
          </p>
        ) : (
          categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="sr-only"
                aria-label={cat.name}
              />
              <div
                className={`relative w-8 h-8 bg-white rounded border-[0.5px] border-solid ${selectedCategories.has(cat.slug)
                  ? "bg-x-600 border-x-600"
                  : "border-x-600"
                  } flex items-center justify-center`}
              >
                {selectedCategories.has(cat.slug) && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <span className="mt-[-1.00px] relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                {cat.name}
              </span>
            </label>
          ))
        )}
      </div>

      {/* Color Filter */}
      <button className="flex items-center justify-between pt-6 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
        <h3 className="font-text-300-demi text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] relative w-fit font-[number:var(--text-300-demi-font-weight)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Color
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>
      <div className="gap-4 flex-[0_0_auto] flex flex-col items-start relative self-stretch w-full">
        {colors.length === 0 ? (
          <p className="font-text-200 text-x-300 text-[length:var(--text-200-font-size)]">No colors available</p>
        ) : (
          Array.from({ length: Math.ceil(colors.length / 3) }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-start relative self-stretch w-full flex-[0_0_auto]"
            >
              {colors.slice(rowIndex * 3, rowIndex * 3 + 3).map((color) => (
                <button
                  key={color.name}
                  className="flex flex-col items-center gap-2 relative flex-1 grow"
                  onClick={() => handleColorSelect(color.name)}
                  aria-label={`Filter by ${color.name}`}
                >
                  <div
                    className={`relative w-6 h-6 rounded-xl border border-solid border-gray-300 shadow-sm ${selectedColor === color.name
                      ? "ring-2 ring-offset-2 ring-x-600"
                      : ""
                      }`}
                  >
                    <div
                      className="h-full rounded-xl"
                      style={{ background: color.hex }}
                    />
                  </div>
                  <span
                    className={`font-text-200 text-x-600 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] relative w-fit font-[number:var(--text-200-font-weight)] whitespace-nowrap [font-style:var(--text-200-font-style)] ${selectedColor === color.name ? "font-bold" : ""
                      }`}
                  >
                    {color.name}
                  </span>
                </button>
              ))}
              {/* Dummy elements to keep grid aligned if row is less than 3 */}
              {Array.from({ length: 3 - colors.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, idx) => (
                <div key={`dummy-${idx}`} className="flex-1 grow"></div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Size Filter */}
      <button className="flex items-center justify-between pt-6 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
        <h3 className="relative w-fit font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-500 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Size
        </h3>
        <CaretUp className="!relative !w-3 !h-3" />
      </button>

      {/* Waist sizes */}
      {waistSizes.length > 0 && (
        <div className="flex flex-col items-start gap-2 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <h4 className="relative self-stretch mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-400 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
            Waist
          </h4>
          {Array.from({ length: Math.ceil(waistSizes.length / 4) }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-start gap-1 relative self-stretch w-full flex-[0_0_auto]"
            >
              {waistSizes.slice(rowIndex * 4, rowIndex * 4 + 4).map((size) => (
                <button
                  key={size}
                  className={`flex items-center justify-center gap-2.5 p-3 relative flex-1 grow ${selectedWaist === size
                    ? "bg-black text-white"
                    : "bg-x-100 hover:bg-gray-200"
                    } transition-colors duration-200 max-w-[25%]`}
                  onClick={() => handleWaistSelect(size)}
                  aria-label={`Select waist size ${size}`}
                >
                  <span
                    className={`w-fit whitespace-nowrap relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)] ${selectedWaist === size ? "text-white" : "text-x-500"
                      }`}
                  >
                    {size}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Clothing sizes */}
      {clothingSizes.length > 0 && (
        <div className="flex flex-col items-start gap-2 pt-0 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <h4 className="relative self-stretch mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-400 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
            Clothing
          </h4>
          {Array.from({ length: Math.ceil(clothingSizes.length / 4) }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-start gap-1 relative self-stretch w-full flex-[0_0_auto]"
            >
              {clothingSizes.slice(rowIndex * 4, rowIndex * 4 + 4).map((size) => (
                <button
                  key={size}
                  className={`flex items-center justify-center gap-2.5 p-3 relative flex-1 grow ${selectedSize === size
                    ? "bg-black text-white"
                    : "bg-x-100 hover:bg-gray-200"
                    } transition-colors duration-200 max-w-[25%]`}
                  onClick={() => handleSizeSelect(size)}
                  aria-label={`Select clothing size ${size}`}
                >
                  <span
                    className={`w-fit whitespace-nowrap relative mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)] ${size === "XXXL" ? "ml-[-2.50px] mr-[-2.50px]" : ""
                      } ${selectedSize === size ? "text-white" : "text-x-500"}`}
                  >
                    {size}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
