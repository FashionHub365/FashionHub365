import React from "react";

export const ListingHeader = () => {
  return (
    <header className="flex flex-col items-start pt-4 pb-2 px-0 relative self-stretch w-full flex-[0_0_auto]">
      <nav
        className="self-start mt-[-1.00px] font-text-200 text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)]"
        aria-label="Breadcrumb"
      >
        Home / Men
      </nav>
      <h1 className="relative self-stretch font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
        Men&apos;s Clothing &amp; Apparel - New Arrivals
      </h1>
      <div className="relative self-stretch font-text-400 font-[number:var(--text-400-font-weight)] text-x-600 text-[length:var(--text-400-font-size)] tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
        Featured
      </div>
    </header>
  );
};
