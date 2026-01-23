export const ProductionProcessSection = () => {
  return (
    <section className="h-[552px] items-start bg-timberwolf flex relative self-stretch w-full">
      <div className="flex flex-col items-center justify-center gap-5 px-[70px] py-0 relative flex-1 self-stretch grow">
        <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <h3 className="mt-[-1.00px] text-x-600 text-[length:var(--text-200-demi-font-size)] leading-[var(--text-200-demi-line-height)] relative self-stretch font-text-200-demi font-[number:var(--text-200-demi-font-weight)] tracking-[var(--text-200-demi-letter-spacing)] [font-style:var(--text-200-demi-font-style)]">
            OUR QUALITY
          </h3>

          <h2 className="relative self-stretch font-display-400 font-[number:var(--display-400-font-weight)] text-x-600 text-[length:var(--display-400-font-size)] tracking-[var(--display-400-letter-spacing)] leading-[var(--display-400-line-height)] [font-style:var(--display-400-font-style)]">
            Designed
            <br />
            to last.
          </h2>
        </header>

        <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
          At Everlane, we&apos;re not big on trends. We want you to wear our
          pieces for years, even decades, to come. That&apos;s why we source the
          finest materials and factories for our timeless products— like our
          Grade-A cashmere sweaters, Italian shoes, and Peruvian Pima tees.
        </p>
      </div>

      <img
        className="w-[700] h-[600px] flex-1 grow relative self-stretch object-cover"
        alt="Image showing quality materials and craftsmanship"
        src="/textures/aboutpage/image6.jpg"
      />
    </section>
  );
};
