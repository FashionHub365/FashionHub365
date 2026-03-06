import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "./Icons";

export const SearchOverlay = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/listing?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const categories = [
    {
      id: 1,
      image: "/textures/search/image.jpg",
      title: "Men's Jeans",
      alt: "Men's jeans collection",
      slug: "jeans",
    },
    {
      id: 2,
      image: "/textures/search/image-2.jpg",
      title: "Men's Sneakers",
      alt: "Men's sneakers collection",
      slug: "sneakers",
    },
    {
      id: 3,
      image: "/textures/search/image-3.jpg",
      title: "Men's Jackets",
      alt: "Men's jackets collection",
      slug: "jackets",
    },
    {
      id: 4,
      image: "/textures/search/image-4.jpg",
      title: "Men's Boots",
      alt: "Men's boots collection",
      slug: "boots",
    },
  ];

  return (
    <div className="w-full relative bg-white z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <section className="flex items-start px-4 md:px-[326px] py-6 relative border-t [border-top-style:solid] border-x-200">
        <div className="flex flex-1 grow bg-x-100 items-center gap-2.5 p-4 relative rounded focus-within:ring-2 focus-within:ring-x-300 focus-within:ring-offset-2">
          <button
            type="button"
            onClick={handleSearch}
            className="flex-shrink-0 bg-transparent border-0 cursor-pointer p-0"
            aria-label="Search"
          >
            <MagnifyingGlass className="!relative !w-4 !h-4 text-x-300 hover:text-x-600 transition-colors" />
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
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
                    e.target.style.display = "none";
                  }}
                />
              </div>

              <Link
                to={`/listing?category=${category.slug}`}
                className="relative self-stretch font-text-400-underline font-[number:var(--text-400-underline-font-weight)] text-x-400 text-[length:var(--text-400-underline-font-size)] tracking-[var(--text-400-underline-letter-spacing)] leading-[var(--text-400-underline-line-height)] underline [font-style:var(--text-400-underline-font-style)]"
                onClick={onClose}
              >
                {category.title}
              </Link>
            </div>
          ))}
        </nav>
      </section>
    </div>
  );
};
