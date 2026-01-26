import React from "react";

export const ProductDescriptionSection = () => {
  const sections = [
    {
      title: "Textures and Layers",
      content: [
        {
          text: "Winter fashion is all about layering, and white outfits provide the perfect base for playing with textures and layers. Start with your ",
          type: "text",
        },
        {
          text: "white turtleneck ",
          type: "link",
          href: "https://www.everlane.com/products/womens-supima-rib-turtleneck-white",
        },
        {
          text: "and experiment with different fabrics like wool, cashmere, and silk to add depth and interest to your look. A ",
          type: "text",
        },
        {
          text: "white silk blouse",
          type: "link",
          href: "https://www.everlane.com/products/womens-clean-silk-v-neck-top-bone-black-polka-dot?collection=womens-tops",
        },
        {
          text: " layered under a chunky knit sweater or a white wool skirt paired with a ",
          type: "text",
        },
        {
          text: "turtleneck",
          type: "link",
          href: "https://www.everlane.com/products/womens-cloud-oversized-turtleneck-bone?collection=womens-sweaters",
        },
        {
          text: " creates a textural look that's both cozy and chic.",
          type: "text",
        },
      ],
    },
    {
      title: "Accessorize with Neutrals",
      content: [
        {
          text: "When working with a predominantly white palette, neutrals become your best friends. From ",
          type: "text",
        },
        {
          text: "white leather Chelsea boots",
          type: "link",
          href: "https://www.everlane.com/products/womens-gum-sole-chelsea-boot-off-white",
        },
        {
          text: " to ",
          type: "text",
        },
        {
          text: "off-white beanies",
          type: "link",
          href: "https://www.everlane.com/products/womens-chunky-beanie-canvas",
        },
        {
          text: " mix in plenty of winter-ready accessories and shoes for those finishing outfit tonal touches.\n\nSo, step into the season with confidence, and let your winter whites make a bold and beautiful statement. Shop our ",
          type: "text",
        },
        {
          text: "winter white edit here",
          type: "link",
          href: "https://www.everlane.com/collections/womens-holiday-looks/style/winter-whites",
        },
        {
          text: ".",
          type: "text",
        },
      ],
    },
  ];

  return (
    <section className="flex flex-col items-start gap-11 px-[228px] py-[100px] relative self-stretch w-full flex-[0_0_auto]">
      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="flex flex-col items-start gap-11 relative self-stretch w-full"
        >
          <h2 className="relative self-stretch mt-[-1.00px] font-display-400-demi font-[number:var(--display-400-demi-font-weight)] text-x-600 text-[length:var(--display-400-demi-font-size)] tracking-[var(--display-400-demi-letter-spacing)] leading-[var(--display-400-demi-line-height)] [font-style:var(--display-400-demi-font-style)]">
            {section.title}
          </h2>

          <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
            {section.content.map((item, itemIndex) => {
              if (item.type === "link") {
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

              return (
                <span
                  key={itemIndex}
                  className="font-display-100 font-[number:var(--display-100-font-weight)] text-black text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {item.text}
                </span>
              );
            })}
          </p>
        </div>
      ))}
    </section>
  );
};
