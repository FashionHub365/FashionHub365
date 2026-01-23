export const FeaturedProductsSection = () => {
  const features = [
    {
      image: "/textures/landingpage/image-17.jpg",
      title: "Complimentary Shipping",
      description: "Enjoy free shipping on U.S. orders over $100.",
      alt: "Complimentary Shipping Icon",
    },
    {
      image: "/textures/landingpage/image-18.jpg",
      title: "Consciously Crafted",
      description: "Designed with you and the planet in mind.",
      alt: "Consciously Crafted Icon",
    },
    {
      image: "/textures/landingpage/image-19.jpg",
      title: "Come Say Hi",
      description: "We have 11 stores across the U.S.",
      alt: "Store Locations Icon",
    },
  ];

  return (
    <section className="items-start gap-1.5 px-[77px] py-[90px] flex relative self-stretch w-full flex-[0_0_auto]">
      {features.map((feature, index) => (
        <article
          key={index}
          className="flex flex-col items-center gap-5 px-[55px] py-0 relative flex-1 grow"
        >
          <img
            className="relative w-[78px] h-[78px] object-cover"
            alt={feature.alt}
            src={feature.image}
          />

          <div className="flex flex-col items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
            <h3 className="relative self-stretch mt-[-1.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-500 text-[length:var(--text-300-demi-font-size)] text-center tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] [font-style:var(--text-300-demi-font-style)]">
              {feature.title}
            </h3>

            <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
              {feature.description}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
};
