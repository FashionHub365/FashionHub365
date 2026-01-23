export const ProgressSection = () => {
  return (
    <section className="gap-8 px-[60px] py-[90px] bg-x-600 flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="self-start mt-[-1.00px] font-display-600-demi font-[number:var(--display-600-demi-font-weight)] text-white text-[length:var(--display-600-demi-font-size)] tracking-[var(--display-600-demi-letter-spacing)] leading-[var(--display-600-demi-line-height)] [font-style:var(--display-600-demi-font-style)]">
        Follow us on social for more
      </h2>

      <button
        type="button"
        className="all-[unset] box-border bg-white flex w-60 items-center justify-center gap-2.5 px-[100px] py-5 relative flex-[0_0_auto] rounded-lg cursor-pointer"
        aria-label="Visit Everlane Instagram"
      >
        <span className="relative w-fit mt-[-1.00px] ml-[-50.50px] mr-[-50.50px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-600 text-[length:var(--text-300-demi-font-size)] text-center tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          @Everlane Instagram
        </span>
      </button>
    </section>
  );
};
