import React, { useState } from "react";

export const CartRecommendations = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Placeholder data
  const products = [
    {
      id: 1,
      name: "The Good Merino Wool Beanie",
      size: "One Size",
      color: "Chambray Blue",
      price: "$35",
      image: "/textures/cartpage/image-3.jpg", // Assuming placeholder
    },
  ];

  const totalSlides = 4;

  const handleAddToCart = () => {
    console.log("Product added to cart");
  };

  const handleDotClick = (index) => {
    setActiveSlide(index);
  };

  return (
    <section className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-x-600 text-[length:var(--text-300-demi-font-size)] tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] [font-style:var(--text-300-demi-font-style)]">
        Before You Go
      </h2>

      <article className="items-start gap-4 p-2.5 ml-[-1.00px] mr-[-1.00px] border border-solid border-x-200 flex relative self-stretch w-full flex-[0_0_auto]">
        <img
          className="w-[70px] h-[100px] relative object-cover"
          alt={products[0].name}
          src={products[0].image}
        />

        <div className="flex flex-col items-start justify-between relative flex-1 self-stretch grow">
          <div className="flex flex-col items-start text-left relative self-stretch w-full flex-[0_0_auto]">
            <h3 className="relative self-stretch mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
              {products[0].name}
            </h3>

            <p className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              {products[0].size} | {products[0].color}
            </p>
          </div>

          <div className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="font-text-200-demi text-x-500 text-[length:var(--text-200-demi-font-size)] tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] relative w-fit font-[number:var(--text-200-demi-font-weight)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
              {products[0].price}
            </div>

            <button
              className="all-[unset] box-border w-[81px] flex items-center justify-center gap-2.5 px-0 py-3 relative bg-x-500 cursor-pointer hover:opacity-90 focus:outline-2 focus:outline-offset-2 focus:outline-x-500"
              onClick={handleAddToCart}
              aria-label={`Add ${products[0].name} to cart`}
            >
              <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-white text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
                ADD
              </span>
            </button>
          </div>
        </div>
      </article>

      <nav
        className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]"
        aria-label="Product carousel navigation"
      >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`relative w-[7px] h-[7px] rounded-[3.5px] cursor-pointer border-0 p-0 ${
              index === activeSlide ? "bg-x-500" : "bg-x-200"
            } hover:opacity-80 focus:outline-2 focus:outline-offset-2 focus:outline-x-500`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeSlide ? "true" : "false"}
          />
        ))}
      </nav>
    </section>
  );
};
