export const HeroBannerSection = () => {
  const bannerCards = [
    {
      title: "Our Holiday Gift Picks",
      image: "/textures/landingpage/image-15.jpg",
      description: "The best presents for everyone on your list.",
      linkText: "Read More",
      linkHref: "#",
    },
    {
      title: "Cleaner Fashion",
      image: "/textures/landingpage/image-16.jpg",
      description:
        "See the sustainability efforts behind each of our products.",
      linkText: "Learn More",
      linkHref: "#",
    },
  ];

  return (
    <section className="items-start gap-5 px-[185px] py-[90px] flex relative self-stretch w-full flex-[0_0_auto]">
      {bannerCards.map((card, index) => (
        <article
          key={index}
          className="flex flex-col items-center gap-5 relative flex-1 grow"
        >
          <h2 className="relative self-stretch mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-x-500 text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
            {card.title}
          </h2>

          <img
            className="relative self-stretch w-full h-[626px] object-cover"
            alt={card.title}
            src={card.image}
          />

          <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
            {card.description}
          </p>

          <div className="flex items-center justify-center gap-2.5 px-5 py-[15px] relative self-stretch w-full flex-[0_0_auto]">
            <a
              href={card.linkHref}
              className="relative w-fit mt-[-1.00px] font-text-300-underline font-[number:var(--text-300-underline-font-weight)] text-x-500 text-[length:var(--text-300-underline-font-size)] text-center tracking-[var(--text-300-underline-letter-spacing)] leading-[var(--text-300-underline-line-height)] underline whitespace-nowrap [font-style:var(--text-300-underline-font-style)]"
            >
              {card.linkText}
            </a>
          </div>
        </article>
      ))}
    </section>
  );
};
