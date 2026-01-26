export const ProductShowcaseSection = () => {
  return (
    <section className="h-[660px] items-start flex relative self-stretch w-full">
      <div className="relative flex-1 self-stretch grow">
        <img
          className="w-full h-full object-cover"
          alt="Product showcase displaying transparent pricing methodology"
          src="/textures/aboutpage/image4.jpg"
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-5 px-[70px] py-0 relative flex-1 self-stretch grow">
        <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <h3 className="mt-[-1.00px] text-x-600 text-[length:var(--text-200-demi-font-size)] leading-[var(--text-200-demi-line-height)] relative self-stretch font-text-200-demi font-[number:var(--text-200-demi-font-weight)] tracking-[var(--text-200-demi-letter-spacing)] [font-style:var(--text-200-demi-font-style)]">
            OUR PRICES
          </h3>

          <h2 className="relative self-stretch font-display-400 font-[number:var(--display-400-font-weight)] text-x-600 text-[length:var(--display-400-font-size)] tracking-[var(--display-400-letter-spacing)] leading-[var(--display-400-line-height)] [font-style:var(--display-400-font-style)]">
            Radically Transparent.
          </h2>
        </header>

        <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
          We believe our customers have a right to know how much their clothes
          cost to make. We reveal the true costs behind all of our products—from
          materials to labor to transportation—then offer them to you, minus the
          traditional retail markup.
        </p>
      </div>
    </section>
  );
};
