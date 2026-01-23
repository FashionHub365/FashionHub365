export const PromotionalBannersSection = () => {
  return (
    <section className="flex-col items-start gap-2.5 px-[42px] py-[90px] flex relative self-stretch w-full flex-[0_0_auto]">
      <div 
        className="flex flex-col h-[281px] items-center justify-center gap-5 px-0 py-11 relative self-stretch w-full bg-cover bg-[50%_50%]"
        style={{ backgroundImage: `url(/textures/landingpage/frame-1-2.jpg)` }}
      >
        <div className="flex flex-col items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
          <h2 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-white text-[length:var(--display-200-font-size)] text-center tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
            We&apos;re on a Mission To Clean Up the Industry
          </h2>

          <p className="relative self-stretch font-text-400 font-[number:var(--text-400-font-weight)] text-white text-[length:var(--text-400-font-size)] text-center tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
            Read about our progress in our latest Impact Report.
          </p>
        </div>

        <button
          type="button"
          className="all-[unset] box-border flex w-60 items-center justify-center gap-2.5 px-0 py-3 relative flex-[0_0_auto] bg-white cursor-pointer hover:opacity-90 transition-opacity focus:outline-2 focus:outline-offset-2 focus:outline-white"
          aria-label="Learn more about our mission to clean up the industry"
        >
          <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
            LEARN MORE
          </span>
        </button>
      </div>
    </section>
  );
};
