import { useState } from "react";
import { ArrowRight, MagnifyingGlass, ShoppingCartSimple, User } from "./Icons";
import { IconComponentNode } from "./IconComponentNode";
import { SearchOverlay } from "./SearchOverlay";
import { CartSidebar } from "./CartPage/CartSidebar";

export const HeaderSection = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const mainNavItems = [
    { label: "Women", active: false },
    { label: "Men", active: true },
    { label: "About", active: false },
    { label: "Everworld Stories", active: false },
  ];

  const subNavItems = [
    { label: "Holiday Gifting", color: "text-x-500" },
    { label: "New Arrivals", color: "text-x-500" },
    { label: "Best-Sellers", color: "text-x-500" },
    { label: "Clothing", color: "text-x-500" },
    { label: "Tops & Sweaters", color: "text-x-500" },
    { label: "Pants & Jeans", color: "text-x-500" },
    { label: "Outerwear", color: "text-x-500" },
    { label: "Shoes & Bags", color: "text-x-500" },
    { label: "Sale", color: "text-red" },
  ];

  // Data for the mega menu (specific to "Men" or generally for the example)
  const highlightsData = [
    "Shop All New Arrivals",
    "The Gift Guide",
    "New Bottoms",
    "New Tops",
    "T-Shirt Bundles",
    "Under $100",
  ];

  const featuredShopsData = [
    "The Holiday Outfit Edit",
    "Giftable Sweaters",
    "Uniform & Capsule",
    "The Performance Chino Shop",
    "Top Rated Men's Clothing",
  ];

  const featuredCardsData = [
    {
      title: "The Holiday\nOutfit Edit",
      image: "/textures/landingpage/frame-4.jpg", // Using existing textures path or similar
    },
    {
      title: "Giftable\nSweaters",
      image: "/textures/landingpage/frame-5.jpg",
    },
  ];

  return (
    <>
    <header className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto] bg-white z-50">
      <div className="flex items-center justify-around gap-1 px-[30px] py-[7px] relative self-stretch w-full flex-[0_0_auto] bg-x-600">
        <div className="flex items-center justify-center gap-1 relative flex-1 grow">
          <p className="relative w-fit mt-[-1.00px] font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-white text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
            Get early access on launches and offers.
          </p>

          <a
            href="#signup"
            className="relative w-fit mt-[-1.00px] font-text-200-underline font-[number:var(--text-200-underline-font-weight)] text-white text-[length:var(--text-200-underline-font-size)] text-center tracking-[var(--text-200-underline-letter-spacing)] leading-[var(--text-200-underline-line-height)] underline whitespace-nowrap [font-style:var(--text-200-underline-font-style)]"
          >
            Sign Up For Texts
          </a>

          <ArrowRight className="!relative !w-3.5 !h-3.5" />
        </div>

        <div className="inline-flex items-center gap-3 absolute top-[calc(50.00%_-_8px)] right-[30px]">
          <img
            className="relative w-[21px] h-[15px]"
            alt="Viet Nam Flag"
            src="/textures/landingpage/us-1.webp"
          />

          <div className="text-white relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
            VND
          </div>
        </div>
      </div>

      <nav
        className="flex items-center justify-between px-[68px] py-0 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200"
        aria-label="Main navigation"
      >
        <ul className="inline-flex items-start relative flex-[0_0_auto] h-full">
          {mainNavItems.map((item, index) => (
            <li
              key={index}
              className={`gap-3 px-3 h-full inline-flex flex-col items-center justify-center relative cursor-pointer`}
            >
              <div className={`py-5 ${item.active ? "border-b-2 border-x-500" : "border-b-2 border-transparent hover:border-x-500"}`}>
                <a
                  href={`#${item.label.toLowerCase()}`}
                  className="text-x-500 relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]"
                >
                  {item.label}
                </a>
              </div>
            </li>
          ))}
        </ul>

        <div className="inline-flex items-center justify-end relative flex-[0_0_auto]">
          <button
            className="inline-flex items-center justify-center gap-2.5 p-3 relative flex-[0_0_auto]"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <MagnifyingGlass className="!relative !w-4 !h-4" />
          </button>

          <button
            className="inline-flex items-center justify-center gap-2.5 p-3 relative flex-[0_0_auto]"
            aria-label="User account"
          >
            <User className="!relative !w-4 !h-4" />
          </button>

          <button
            className="inline-flex items-center justify-center gap-2.5 p-3 relative flex-[0_0_auto]"
            aria-label="Shopping cart"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCartSimple className="!relative !w-4 !h-4" />
          </button>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 pointer-events-none">
          <img
            className="w-full h-full object-contain"
            alt="FashionHub Logo"
            src="/textures/landingpage/vector-3.png"
          />
        </div>
      </nav>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
      <nav
        className={`flex items-center justify-center relative self-stretch w-full flex-[0_0_auto] ${isSearchOpen ? "hidden" : ""}`}
        aria-label="Category navigation"
      >
        <ul className="flex items-center justify-center">
          {subNavItems.map((item, index) => (
            <li
              key={index}
              className="gap-3 px-3 py-5 inline-flex flex-col items-start relative flex-[0_0_auto] cursor-pointer"
              onMouseEnter={() => setActiveMenu(item.label)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <a
                href={`#${item.label.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
                className={`${item.color} relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mega Menu Overlay */}
      <div 
        className={`absolute top-full left-0 w-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${activeMenu ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        onMouseEnter={() => setActiveMenu(activeMenu)}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <section className="flex items-start justify-center gap-6 pt-[54px] pb-[90px] px-[140px] relative w-full border-t border-x-200">
          <nav
            className="flex flex-col items-start gap-4 relative flex-1 grow"
            aria-labelledby="highlights-heading"
          >
            <h2
              id="highlights-heading"
              className="relative self-stretch mt-[-1.00px] font-text-100-demi font-[number:var(--text-100-demi-font-weight)] text-x-300 text-[length:var(--text-100-demi-font-size)] tracking-[var(--text-100-demi-letter-spacing)] leading-[var(--text-100-demi-line-height)] [font-style:var(--text-100-demi-font-style)]"
            >
              HIGHLIGHTS
            </h2>

            <ul className="contents">
              {highlightsData.map((item, index) => (
                <li key={index} className="contents">
                  <a
                    href="#"
                    className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] hover:underline focus:outline-none focus:underline"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="flex flex-col items-start gap-4 relative flex-1 grow"
            aria-labelledby="featured-shops-heading"
          >
            <h2
              id="featured-shops-heading"
              className="relative self-stretch mt-[-1.00px] font-text-100-demi font-[number:var(--text-100-demi-font-weight)] text-x-300 text-[length:var(--text-100-demi-font-size)] tracking-[var(--text-100-demi-letter-spacing)] leading-[var(--text-100-demi-line-height)] [font-style:var(--text-100-demi-font-style)]"
            >
              FEATURED SHOPS
            </h2>

            <ul className="contents">
              {featuredShopsData.map((item, index) => (
                <li key={index} className="contents">
                  <a
                    href="#"
                    className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] hover:underline focus:outline-none focus:underline"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {featuredCardsData.map((card, index) => (
            <a
              key={index}
              href="#"
              className="flex h-[300px] left-5 items-end gap-3 px-4 py-3 relative flex-1 grow bg-cover bg-[50%_50%] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-x-500 transition-opacity"
              style={{ backgroundImage: `url(${card.image})` }}
              aria-label={card.title.replace("\n", " ")}
            >
              <span className="absolute bottom-4 left-4 text-white leading-tight text-[22px] font-semibold">
                {card.title.split("\n").map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < card.title.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </span>

             <IconComponentNode className="absolute bottom-4 right-4 w-6 h-6 text-white -rotate-90" />
            </a>
          ))}
        </section>
      </div>


    </header>
    <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
