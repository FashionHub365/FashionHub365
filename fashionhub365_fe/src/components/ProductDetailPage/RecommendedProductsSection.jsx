import React from "react";

export const RecommendedProductsSection = () => {
    const products = [
      {
        id: 1,
        image: "/textures/productdetailpage/image7.jpg",
        title: "The Waffle Long-Sleeve Crew",
        originalPrice: "$60",
        salePrice: "$60",
        color: "Bone",
      },
      {
        id: 2,
        image: "/textures/productdetailpage/image8.jpg",
        title: "The Waffle Long-Sleeve Crew",
        originalPrice: "$60",
        salePrice: "$60",
        color: "Bone",
      },
      {
        id: 3,
        image: "/textures/productdetailpage/image9.jpg",
        title: "The Waffle Long-Sleeve Crew",
        originalPrice: "$60",
        salePrice: "$60",
        color: "Bone",
      },
      {
        id: 4,
        image: "/textures/productdetailpage/image10.jpg",
        title: "The Waffle Long-Sleeve Crew",
        originalPrice: "$60",
        salePrice: "$60",
        color: "Bone",
      },
    ];
  
    return (
      <section className="flex-col items-start gap-2 px-[196px] py-16 flex relative self-stretch w-full flex-[0_0_auto]">
        <h2 className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
          Recommended Products
        </h2>
  
        <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col items-start gap-2.5 relative flex-1 grow"
            >
              <img
                className="w-full h-[392px] relative self-stretch object-cover"
                alt={product.title}
                src={product.image}
              />
  
              <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-start gap-3 px-0 py-2 relative self-stretch w-full flex-[0_0_auto]">
                  <h3 className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                    {product.title}
                  </h3>
  
                  <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
                    <span className="relative w-fit mt-[-1.00px] font-text-200-strikethrough font-[number:var(--text-200-strikethrough-font-weight)] text-x-300 text-[length:var(--text-200-strikethrough-font-size)] text-right tracking-[var(--text-200-strikethrough-letter-spacing)] leading-[var(--text-200-strikethrough-line-height)] line-through whitespace-nowrap [font-style:var(--text-200-strikethrough-font-style)]">
                      {product.originalPrice}
                    </span>
  
                    <span className="w-fit font-text-200-demi text-x-500 text-[length:var(--text-200-demi-font-size)] text-right tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap relative mt-[-1.00px] font-[number:var(--text-200-demi-font-weight)] [font-style:var(--text-200-demi-font-style)]">
                      {product.salePrice}
                    </span>
                  </div>
                </div>
  
                <p className="relative self-stretch h-4 font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                  {product.color}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };
