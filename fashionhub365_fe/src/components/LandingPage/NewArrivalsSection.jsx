export const NewArrivalsSection = () => {
  return (
    <section 
      className="flex-col items-start justify-center gap-2.5 pl-8 pr-[632px] py-[275px] bg-cover bg-[50%_50%] flex relative self-stretch w-full flex-[0_0_auto]"
      style={{ backgroundImage: `url(/textures/landingpage/section-01.jpg)` }}
    >
      <div className="flex flex-col w-[632px] items-center gap-[30px] relative flex-[0_0_auto]">
        <header className="flex flex-col items-center gap-3.5 relative self-stretch w-full flex-[0_0_auto]">
          <h1 className="relative self-stretch mt-[-1.00px] font-display-500 font-[number:var(--display-500-font-weight)] text-white text-[length:var(--display-500-font-size)] text-center tracking-[var(--display-500-letter-spacing)] leading-[var(--display-500-line-height)] [font-style:var(--display-500-font-style)]">
            Your Cozy Era
          </h1>

          <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-white text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
            Get peak comfy-chic
            <br />
            with new winter essentials.
          </p>
        </header>

        <button
          className="all-[unset] box-border flex w-60 items-center justify-center gap-2.5 px-0 py-3 relative flex-[0_0_auto] bg-white cursor-pointer hover:opacity-90 transition-opacity focus:outline-2 focus:outline-offset-2 focus:outline-white"
          type="button"
          aria-label="Shop now for new winter essentials"
        >
          <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
            SHOP NOW
          </span>
        </button>
      </div>
    </section>
  );
};
