import React, { useState } from "react";
import { MagnifyingGlass } from "./Icons";

export const SearchOverlay = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    console.log("Search clicked for:", searchTerm);
    // Implement actual search logic here
  };

  const categories = [
    {
      id: 1,
      image: "/textures/search/image.jpg",
      title: "Women's Sweaters",
      alt: "Woman wearing a black sweater",
    },
    {
      id: 2,
      image: "/textures/search/image-2.jpg",
      title: "Women's Bottom",
      alt: "Woman wearing striped bottom wear",
    },
    {
      id: 3,
      image: "/textures/search/image-3.jpg",
      title: "Women's Boots",
      alt: "Black leather women's boots",
    },
    {
      id: 4,
      image: "/textures/search/image-4.jpg",
      title: "Men's Best Sellers",
      alt: "Man wearing casual outfit",
    },
  ];

  return (
    <div className="w-full relative bg-white z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <section className="flex items-start px-4 md:px-[326px] py-6 relative border-t [border-top-style:solid] border-x-200">
        <div className="flex flex-1 grow bg-x-100 items-center gap-2.5 p-4 relative rounded focus-within:ring-2 focus-within:ring-x-300 focus-within:ring-offset-2">
            <MagnifyingGlass className="!relative !w-4 !h-4 text-x-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="bg-transparent border-none outline-none w-full font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] placeholder:text-x-300"
              autoFocus
            />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex flex-[0_0_auto] items-center gap-2.5 p-4 relative rounded cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-x-300 focus:ring-offset-2 active:opacity-60 ml-4"
          aria-label="Cancel"
        >
          <span className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
            Cancel
          </span>
        </button>
      </section>

      <section
        className="absolute top-full left-0 w-full bg-white shadow-lg flex flex-col items-start gap-4 px-4 md:px-[156px] py-8 relative border-t [border-top-style:solid] border-x-200"
        aria-labelledby="popular-categories-heading"
      >
        <h2
          id="popular-categories-heading"
          className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-400 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]"
        >
          Popular Categories
        </h2>

        <nav
          className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto] overflow-x-auto pb-4"
          aria-label="Popular product categories"
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col items-start gap-2.5 relative flex-1 grow min-w-[200px]"
            >
                <div className="relative self-stretch w-full h-[340px] bg-gray-100 overflow-hidden group">
                     <img
                        className="relative self-stretch w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={category.alt}
                        src={category.image}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'text-gray-400');
                            e.target.parentElement.innerHTML = '<span>Image not found</span>';
                        }}
                    />
                </div>

              <a
                href={`#${category.title.toLowerCase().replace(/[']/g, "").replace(/\s+/g, "-")}`}
                className="relative self-stretch font-text-400-underline font-[number:var(--text-400-underline-font-weight)] text-x-400 text-[length:var(--text-400-underline-font-size)] tracking-[var(--text-400-underline-letter-spacing)] leading-[var(--text-400-underline-line-height)] underline [font-style:var(--text-400-underline-font-style)]"
              >
                {category.title}
              </a>
            </div>
          ))}
        </nav>
      </section>
    </div>
  );
};
