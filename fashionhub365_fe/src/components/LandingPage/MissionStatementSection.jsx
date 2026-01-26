import { useState } from "react";
import { CaretLeft, CaretRight, Star } from "../Icons";

const testimonials = [
  {
    id: 1,
    rating: 5,
    quote:
      "Love this shirt! Fits perfectly and the fabric is thick without being stiff.",
    author: "JonSnSF",
    product: "The Heavyweight Overshirt",
    image: "/textures/landingpage/image-14.jpg",
  },
  {
    id: 2,
    rating: 5,
    quote:
      "Love this shirt! Fits perfectly and the fabric is thick without being stiff.",
    author: "JonSnSF",
    product: "The Heavyweight Overshirt",
    image: "/textures/landingpage/image-14.jpg",
  },
  {
    id: 3,
    rating: 5,
    quote:
      "Love this shirt! Fits perfectly and the fabric is thick without being stiff.",
    author: "JonSnSF",
    product: "The Heavyweight Overshirt",
    image: "/textures/landingpage/image-14.jpg",
  },
  {
    id: 4,
    rating: 5,
    quote:
      "Love this shirt! Fits perfectly and the fabric is thick without being stiff.",
    author: "JonSnSF",
    product: "The Heavyweight Overshirt",
    image: "/textures/landingpage/image-14.jpg",
  },
];

export const MissionStatementSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="flex-col items-center gap-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex items-center gap-[74px] px-[35px] py-0 relative self-stretch w-full flex-[0_0_auto]">
        <button
          onClick={handlePrevious}
          aria-label="Previous testimonial"
          className="focus:outline-none focus:ring-2 focus:ring-x-600"
        >
          <CaretLeft className="!relative !w-6 !h-6" />
        </button>

        <div className="flex flex-col items-start gap-10 px-[62px] py-0 relative flex-1 grow">
          <h2 className="relative self-stretch mt-[-1.00px] font-text-400 font-[number:var(--text-400-font-weight)] text-x-600 text-[length:var(--text-400-font-size)] tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
            People Are Talking
          </h2>

          <div className="flex flex-col items-start gap-[15px] relative self-stretch w-full flex-[0_0_auto]">
            <div
              className="inline-flex items-center gap-0.5 relative flex-[0_0_auto]"
              role="img"
              aria-label={`${currentTestimonial.rating} out of 5 stars`}
            >
              {Array.from({ length: currentTestimonial.rating }).map(
                (_, index) => (
                  <Star key={index} className="!relative !w-3.5 !h-3.5" />
                ),
              )}
            </div>

            <blockquote className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
              &quot;{currentTestimonial.quote}&quot;
            </blockquote>
          </div>

          <p className="relative self-stretch [font-family:'Maison_Neue-Regular',Helvetica] font-normal text-x-600 text-sm tracking-[1.40px] leading-[14px]">
            <span className="tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] font-text-300 [font-style:var(--text-300-font-style)] font-[number:var(--text-300-font-weight)] text-[length:var(--text-300-font-size)]">
              -- {currentTestimonial.author},{" "}
            </span>

            <a
              href="#"
              className="tracking-[var(--text-300-underline-letter-spacing)] leading-[var(--text-300-underline-line-height)] underline font-text-300-underline [font-style:var(--text-300-underline-font-style)] font-[number:var(--text-300-underline-font-weight)] text-[length:var(--text-300-underline-font-size)]"
            >
              {currentTestimonial.product}
            </a>
          </p>
        </div>

        <img
          className="relative flex-1 grow h-[695px] object-cover"
          alt={`${currentTestimonial.author} wearing ${currentTestimonial.product}`}
          src={currentTestimonial.image}
        />

        <button
          onClick={handleNext}
          aria-label="Next testimonial"
          className="focus:outline-none focus:ring-2 focus:ring-x-600"
        >
          <CaretRight className="!relative !w-6 !h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-[73px] px-[77px] py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div
          className="inline-flex items-start gap-3 relative flex-[0_0_auto]"
          role="tablist"
          aria-label="Testimonial navigation"
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`${
                index === currentIndex ? "bg-x-500" : "bg-x-200"
              } relative w-[7px] h-[7px] rounded-[3.5px] focus:outline-none focus:ring-2 focus:ring-x-600`}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <hr className="h-px bg-x-600 relative self-stretch w-full border-0" />
      </div>
    </section>
  );
};
