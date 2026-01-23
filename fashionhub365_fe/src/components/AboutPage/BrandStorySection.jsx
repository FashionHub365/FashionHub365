export const BrandStorySection = () => {
  return (
    <section 
      className="flex-col h-[691px] items-center justify-center gap-2.5 bg-cover bg-[50%_50%] flex relative self-stretch w-full"
      style={{ backgroundImage: "url(/textures/aboutpage/image.jpg)" }}
    >
      <div className="flex flex-col w-[488px] items-center gap-4 relative flex-[0_0_auto]">
        <h2 className="relative self-stretch mt-[-1.00px] font-display-800 font-[number:var(--display-800-font-weight)] text-white text-[length:var(--display-800-font-size)] text-center tracking-[var(--display-800-letter-spacing)] leading-[var(--display-800-line-height)] [font-style:var(--display-800-font-style)]">
          We believe
          <br />
          we can all make
          <br />a difference.
        </h2>

        <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-white text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
          Our way: Exceptional quality.
          <br />
          Ethical factories. Radical Transparency.
        </p>
      </div>
    </section>
  );
};
