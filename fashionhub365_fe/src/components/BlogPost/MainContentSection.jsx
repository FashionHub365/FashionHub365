import React from "react";

export const MainContentSection = () => {
  const sections = [
    {
      title: "Nail the Classics",
      content: [
        { type: "text", text: "Do pure winter chic with a " },
        {
          type: "link",
          text: "classic cashmere white sweater",
          href: "https://www.everlane.com/products/womens-cashmere-boxy-crew-sweater-bone",
        },
        {
          type: "text",
          text: ". Made in the softest cashmere, it's a sweater that will last season after season. Effortlessly elevating any winter outfit, a white sweater is a must for any capsule collection. Just make ",
        },
        {
          type: "link",
          text: "sure you keep it clean and stain free",
          href: "https://www.everlane.com/everworld/how-to-care-for-your-sweaters-tips",
        },
        {
          type: "text",
          text: ", to maintain that clean, polished look. Pair it with dark jeans or ",
        },
        {
          type: "link",
          text: "Utility Barrel",
          href: "https://www.everlane.com/products/womens-utility-arc-pant-organic-bone",
        },
        {
          type: "text",
          text: " pants for a casual yet refined ensemble, or layer it over a collared shirt for a preppy touch.",
        },
      ],
    },
    {
      title: "Monochromatic Magic",
      content: [
        {
          type: "text",
          text: "Nothing feels more luxe than an all-white winter outfit. And the best part? You don't have to break the bank to create a super chic top-to-toe look. Pair classic ",
        },
        {
          type: "link",
          text: "corduroy pants",
          href: "https://www.everlane.com/products/womens-cord-wide-leg-pant-canvas",
        },
        {
          type: "text",
          text: " in a modern wide-legged silhouette with a relaxed ",
        },
        {
          type: "link",
          text: "Oxford style white shirt",
          href: "https://www.everlane.com/products/womens-relaxed-oxford-shirt-white",
        },
        {
          type: "text",
          text: " for a mix-and-match texture play.\nExtra points if you add a ",
        },
        {
          type: "link",
          text: "white blazer",
          href: "https://www.everlane.com/products/womens-linen-oversized-blazer-canvas?collection=womens-blazers",
        },
        { type: "text", text: ", " },
        {
          type: "link",
          text: "cardigan",
          href: "https://www.everlane.com/products/womens-organic-cotton-relaxed-cardigan-canvas?collection=womens-sweaters",
        },
        { type: "text", text: ", or " },
        {
          type: "link",
          text: "sweater",
          href: "https://www.everlane.com/products/womens-alpaca-v-neck-vest-snow?collection=womens-sweaters",
        },
        {
          type: "text",
          text: ". Accessorize with subtle metallic accents or a bold red lip for a pop of color, letting your outfit take center stage.",
        },
      ],
    },
    {
      title: "Keep Warm in White",
      content: [
        { type: "text", text: "Stay warm all winter long with a " },
        {
          type: "link",
          text: "white puffer jacke",
          href: "https://www.everlane.com/products/womens-redown-puffer-jacket-bone",
        },
        {
          type: "text",
          text: "t puffer jacket. This durable, cold weather jacket is puffed-up for extra warmth, giving an on-point blown out silhouette. A white coat not only stands out against the sea of dark winter jackets but also provides a fun canvas for experimenting with textures and patterns. Throw on a white coat over a neutral-toned outfit for an easy elegant look.",
        },
      ],
    },
  ];

  return (
    <article className="flex flex-col items-start gap-11 px-[228px] py-[100px] relative self-stretch w-full flex-[0_0_auto]">
      {sections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          className="flex flex-col items-start gap-11 relative self-stretch w-full"
        >
          <h2
            className={`relative self-stretch ${sectionIndex === 0 ? "mt-[-1.00px]" : ""} font-display-400-demi font-[number:var(--display-400-demi-font-weight)] text-x-600 text-[length:var(--display-400-demi-font-size)] tracking-[var(--display-400-demi-letter-spacing)] leading-[var(--display-400-demi-line-height)] [font-style:var(--display-400-demi-font-style)]`}
          >
            {section.title}
          </h2>

          <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
            {section.content.map((item, itemIndex) => {
              if (item.type === "text") {
                return (
                  <span
                    key={itemIndex}
                    className="font-display-100 font-[number:var(--display-100-font-weight)] text-black text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]"
                  >
                    {item.text}
                  </span>
                );
              } else if (item.type === "link") {
                return (
                  <a
                    key={itemIndex}
                    href={item.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="underline font-display-100 [font-style:var(--display-100-font-style)] font-[number:var(--display-100-font-weight)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] text-[length:var(--display-100-font-size)]">
                      {item.text}
                    </span>
                  </a>
                );
              }
              return null;
            })}
          </p>
        </section>
      ))}
    </article>
  );
};
