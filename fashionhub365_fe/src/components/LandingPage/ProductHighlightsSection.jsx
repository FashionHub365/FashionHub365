import { useState } from "react";
import { CaretLeft, CaretRight } from "../Icons";

export const ProductHighlightsSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const products = [
    {
      id: 1,
      image: "/textures/landingpage/image-9.jpg",
      title: "The Waffle Long-Sleeve Crew",
      price: "$60",
      color: "Bone",
      imageAlt: "The Waffle Long-Sleeve Crew in Bone",
    },
    {
      id: 2,
      image: "/textures/landingpage/image-10.jpg",
      title: "The Bomber Jacket | Uniform",
      price: "$148",
      color: "Toasted Coconut",
      imageAlt: "The Bomber Jacket | Uniform in Toasted Coconut",
    },
    {
      id: 3,
      image: "/textures/landingpage/image-11.jpg",
      title: "The Slim 4-Way Stretch Organic Jean | Uniform",
      price: "$98",
      color: "Dark Indigo",
      imageAlt: "The Slim 4-Way Stretch Organic Jean | Uniform in Dark Indigo",
    },
    {
      id: 4,
      image: "/textures/landingpage/image-12.jpg",
      title: "The Essential Organic Crew",
      price: "$30",
      color: "Vintage Black",
      imageAlt: "The Essential Organic Crew in Vintage Black",
    },
    {
      id: 5,
      image: "/textures/landingpage/image-13.jpg",
      title: "The Heavyweight",
      price: "",
      color: "Heathered Brown",
      imageAlt: "The Heavyweight in Heathered Brown",
    },
  ];

  const totalSlides = 4;

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section
      className="flex-col items-start gap-[30px] pt-[90px] pb-[73px] px-0 flex relative self-stretch w-full flex-[0_0_auto]"
      aria-labelledby="product-highlights-heading"
    >
      <header className="flex flex-col items-center gap-3 px-[42px] py-0 relative self-stretch w-full flex-[0_0_auto]">
        <h2
          id="product-highlights-heading"
          className="relative self-stretch mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-black text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]"
        >
          Everlane Favorites
        </h2>

        <p className="relative self-stretch font-text-400 font-[number:var(--text-400-font-weight)] text-black text-[length:var(--text-400-font-size)] text-center tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
          Beautifully Functional. Purposefully Designed. Consciously Crafted.
        </p>
      </header>

      <div className="flex items-start justify-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
        <button
          onClick={handlePrevious}
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer p-0"
          aria-label="Previous products"
          type="button"
        >
          <CaretLeft className="!relative !w-10 !h-10" />
        </button>

        {products.map((product, index) => (
          <article
            key={product.id}
            className={`flex flex-col items-center gap-1.5 relative ${
              index === 4 ? "w-[120px]" : "flex-1 grow"
            }`}
          >
            <img
              className="relative self-stretch w-full h-[420px] object-cover"
              alt={product.imageAlt}
              src={product.image}
            />

            <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
              <div
                className={`flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto] ${
                  index === 4 ? "justify-around" : ""
                }`}
              >
                <h3 className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                  {product.title}
                </h3>

                {product.price && (
                  <span className="text-x-500 text-right relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                    {product.price}
                  </span>
                )}
              </div>

              <p className="relative self-stretch h-4 font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {product.color}
              </p>
            </div>
          </article>
        ))}

        <button
          onClick={handleNext}
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer p-0"
          aria-label="Next products"
          type="button"
        >
          <CaretRight className="!relative !w-10 !h-10" />
        </button>
      </div>

      <nav
        className="flex items-center justify-center px-0 py-5 self-stretch w-full gap-3 relative flex-[0_0_auto]"
        aria-label="Product carousel pagination"
      >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`${
              currentSlide === index ? "bg-x-500" : "bg-x-200"
            } relative w-[7px] h-[7px] rounded-[3.5px] border-0 cursor-pointer p-0`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? "true" : "false"}
            type="button"
          />
        ))}
      </nav>
    </section>
  );
};
