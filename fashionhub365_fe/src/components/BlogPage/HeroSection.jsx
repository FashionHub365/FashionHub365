export const HeroSection = () => {
  return (
    <section className="gap-2 px-[60px] py-16 flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="h-3.5 relative self-stretch w-full bg-x-500" />

      <div className="flex flex-col items-start max-w-[720px] text-left">
        <h1 className="relative self-stretch mt-[-1.00px] font-display-900-demi font-[number:var(--display-900-demi-font-weight)] text-x-600 text-[length:var(--display-900-demi-font-size)] tracking-[var(--display-900-demi-letter-spacing)] leading-[var(--display-900-demi-line-height)] [font-style:var(--display-900-demi-font-style)]">
          everworld
        </h1>

        <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
          We&apos;re on a mission to clean up a dirty industry.
          <br />
          These are the people, stories, and ideas that will help us get there.
        </p>
      </div>
    </section>
  );
};
