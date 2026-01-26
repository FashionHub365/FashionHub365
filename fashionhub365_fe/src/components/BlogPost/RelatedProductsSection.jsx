import React from "react";

export const RelatedProductsSection = () => {
  const relatedProducts = [
    {
      id: 1,
      image: "/textures/blogpost/image1.jpg",
      title: "How To Style Winter Whites",
      category: "Style",
      alt: "How To Style Winter Whites",
    },
    {
      id: 2,
      image: "/textures/blogpost/image3.jpg",
      title: "We Won A Glossy Award",
      category: "Transparency",
      alt: "We Won A Glossy Award",
    },
    {
      id: 3,
      image: "/textures/blogpost/image4.jpg",
      title: "Coordinate Your Style: Matching Outfits for Everyone",
      category: "Style",
      alt: "Coordinate Your Style: Matching Outfits for Everyone",
    },
  ];

  return (
    <section className="items-start gap-6 flex-[0_0_auto] flex relative self-stretch w-full px-[60px] pb-[100px]">
      {relatedProducts.map((product) => (
        <article
          key={product.id}
          className="flex flex-col items-start gap-5 relative flex-1 grow"
        >
          <img
            className="h-[413px] object-cover relative self-stretch w-full"
            alt={product.alt}
            src={product.image}
          />

          <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <h3 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
              {product.title}
            </h3>

            <span className="inline-flex items-center justify-center gap-2.5 px-5 py-1 relative flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] rounded-[30px] border border-solid border-x-200">
              <span className="relative w-fit font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-600 text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                {product.category}
              </span>
            </span>
          </div>
        </article>
      ))}
    </section>
  );
};
