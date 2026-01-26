import React from "react";

export const ProductCard = ({ product }) => {
  const [selectedColorIndex, setSelectedColorIndex] = React.useState(
    product.colors.findIndex((c) => c.selected) !== -1 ? product.colors.findIndex((c) => c.selected) : 0
  );

  const handleColorClick = (index) => {
    setSelectedColorIndex(index);
  };

  return (
    <article className="flex flex-col items-start gap-2.5 relative flex-1 grow">
      <div className="relative self-stretch w-full">
        <img
          className="relative self-stretch w-full h-[392px] object-cover"
          alt={product.name}
          src={product.image}
        />
        <div className="inline-flex items-center justify-center gap-2.5 px-1.5 py-1 absolute top-2 left-2 bg-white">
          <span className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-red text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
            {product.discount}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex items-start gap-3 px-0 py-2 relative self-stretch w-full flex-[0_0_auto]">
          <h3 className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
            {product.name}
          </h3>
          <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
            <span className="font-text-200-strikethrough text-x-300 line-through relative w-fit mt-[-1.00px] font-[number:var(--text-200-strikethrough-font-weight)] text-[length:var(--text-200-strikethrough-font-size)] text-right tracking-[var(--text-200-strikethrough-letter-spacing)] leading-[var(--text-200-strikethrough-line-height)] whitespace-nowrap [font-style:var(--text-200-strikethrough-font-style)]">
              ${product.originalPrice}
            </span>
            <span className="font-text-200-demi text-x-500 relative w-fit mt-[-1.00px] font-[number:var(--text-200-demi-font-weight)] text-[length:var(--text-200-demi-font-size)] text-right tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
              ${product.salePrice}
            </span>
          </div>
        </div>
        <span className="relative self-stretch h-4 font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
          {product.colors[selectedColorIndex]?.name || product.color}
        </span>
      </div>
      <div className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
        {product.colors.map((color, index) => (
          <button
            key={index}
            className={`w-5 h-5 rounded-full focus:outline-none ${
              selectedColorIndex === index ? "ring-1 ring-offset-2 ring-x-600" : ""
            }`}
            style={{ backgroundColor: color.hex }}
            onClick={() => handleColorClick(index)}
            aria-label={`Select color ${index + 1}`}
          />
        ))}
        {product.colors.length < 5 && <div className="relative w-5 h-5" />}
      </div>
      {product.badges && product.badges.length > 0 && (
        <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          {product.badges.map((badge, index) => (
            <div
              key={index}
              className={`${
                index === 0 ? "ml-[-1.00px]" : ""
              } inline-flex items-center justify-center gap-2.5 px-2 py-1.5 relative flex-[0_0_auto] mt-[-1.00px] mb-[-1.00px] border border-solid border-x-200`}
            >
              <span className="relative w-fit font-text-100 font-[number:var(--text-100-font-weight)] text-x-300 text-[length:var(--text-100-font-size)] text-center tracking-[var(--text-100-letter-spacing)] leading-[var(--text-100-line-height)] whitespace-nowrap [font-style:var(--text-100-font-style)]">
                {badge}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
