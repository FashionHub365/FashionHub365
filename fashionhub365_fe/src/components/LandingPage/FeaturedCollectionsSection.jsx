export const FeaturedCollectionsSection = () => {
  const collections = [
    {
      id: 1,
      title: "New Arrivals",
      buttonText: "SHOP THE LATEST",
      backgroundImage: "/textures/landingpage/frame-1.jpg",
    },
    {
      id: 2,
      title: "Best-Sellers",
      buttonText: "SHOP YOUR FAVORITES",
      backgroundImage: "/textures/landingpage/frame-2.jpg",
    },
    {
      id: 3,
      title: "The Holiday Outfit",
      buttonText: "SHOP OCCASION",
      backgroundImage: "/textures/landingpage/frame-3.jpg",
    },
  ];

  return (
    <section className="items-start gap-3 px-[42px] py-0 flex relative self-stretch w-full flex-[0_0_auto]">
      {collections.map((collection) => (
        <article
          key={collection.id}
          className="flex flex-col h-[534px] items-center justify-center gap-[23px] relative flex-1 grow bg-cover bg-[50%_50%]"
          style={{ backgroundImage: `url(${collection.backgroundImage})` }}
        >
          <h2 className="relative self-stretch font-display-400 font-[number:var(--display-400-font-weight)] text-white text-[length:var(--display-400-font-size)] text-center tracking-[var(--display-400-letter-spacing)] leading-[var(--display-400-line-height)] [font-style:var(--display-400-font-style)]">
            {collection.title}
          </h2>

          <button
            className="all-[unset] box-border flex w-60 items-center justify-center gap-2.5 px-0 py-3 relative flex-[0_0_auto] bg-white cursor-pointer"
            aria-label={`${collection.buttonText} for ${collection.title}`}
          >
            <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
              {collection.buttonText}
            </span>
          </button>
        </article>
      ))}
    </section>
  );
};
