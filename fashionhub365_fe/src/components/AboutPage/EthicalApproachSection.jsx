export const EthicalApproachSection = () => {
  return (
    <section className="h-[733px] items-start bg-timberwolf flex relative self-stretch w-full">
      <img
        className="basis-1/2 h-full object-cover"
        alt="Factory workers in an ethical manufacturing facility"
        src="/textures/aboutpage/image8.jpg"
      />

      <div className="flex flex-col items-center justify-center gap-5 px-[70px] py-0 relative flex-1 self-stretch grow">
        <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <p className="mt-[-1.00px] text-x-600 text-[length:var(--text-200-demi-font-size)] leading-[var(--text-200-demi-line-height)] relative self-stretch font-text-200-demi font-[number:var(--text-200-demi-font-weight)] tracking-[var(--text-200-demi-letter-spacing)] [font-style:var(--text-200-demi-font-style)]">
            OUR FACTORIES
          </p>

          <h2 className="relative self-stretch font-display-400 font-[number:var(--display-400-font-weight)] text-x-600 text-[length:var(--display-400-font-size)] tracking-[var(--display-400-letter-spacing)] leading-[var(--display-400-line-height)] [font-style:var(--display-400-font-style)]">
            Our ethical approach.
          </h2>
        </header>

        <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
          We spend months finding the best factories around the world—the same
          ones that produce your favorite designer labels. We visit them often
          and build strong personal relationships with the owners. Each factory
          is given a compliance audit to evaluate factors like fair wages,
          reasonable hours, and environment. Our goal? A score of 90 or above
          for every factory.
        </p>
      </div>
    </section>
  );
};
