import { useState, useEffect } from "react";
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
      "The perfect everyday tee. It's soft, drapes beautifully, and washes brilliantly.",
    author: "SarahM",
    product: "The Organic Cotton Box-Cut Tee",
    image: "/textures/landingpage/image-1.jpg",
  },
  {
    id: 3,
    rating: 5,
    quote:
      "These jeans are exactly what I've been looking for. So comfortable right out of the box.",
    author: "Alex_D",
    product: "The Slim 4-Way Stretch Organic Jean",
    image: "/textures/landingpage/image-7.jpg",
  },
  {
    id: 4,
    rating: 5,
    quote:
      "Incredible quality for the price. This sweater is warm without being too bulky.",
    author: "Michael T.",
    product: "The Premium Weight Crew",
    image: "/textures/landingpage/image-12.jpg",
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1,
      );
    }, 6000); // Auto-slide every 6 seconds

    return () => clearInterval(intervalId);
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="flex-col items-center gap-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-[1200px] mx-auto min-h-[500px] bg-[#fafafa]">
        {/* Navigation Left */}
        <button
          onClick={handlePrevious}
          aria-label="Previous testimonial"
          className="hidden lg:flex flex-shrink-0 w-12 h-12 items-center justify-center hover:bg-gray-200 rounded-full transition-colors mx-4"
        >
          <CaretLeft className="w-8 h-8 text-gray-800" />
        </button>

        {/* Text Content */}
        <div className="flex flex-col items-center justify-center gap-6 px-10 py-12 flex-1 w-full text-center">
          <h2 className="font-text-200 text-gray-900 text-[16px] tracking-wide uppercase mb-2">
            People Are Talking
          </h2>

          <div className="flex items-center gap-1 text-black">
            {Array.from({ length: currentTestimonial.rating }).map((_, index) => (
              <Star key={index} className="w-4 h-4 fill-current" />
            ))}
          </div>

          <blockquote className="font-display-200 text-gray-900 text-[22px] md:text-[26px] leading-relaxed max-w-[450px]">
            &quot;{currentTestimonial.quote}&quot;
          </blockquote>

          <p className="font-text-200 text-gray-600 text-[13px] tracking-wide mt-2">
            -- {currentTestimonial.author},{" "}
            <button type="button" className="underline hover:text-black transition-colors bg-transparent border-0 cursor-pointer p-0 font-text-200">
              {currentTestimonial.product}
            </button>
          </p>
        </div>

        {/* Image Content */}
        <div className="flex-1 w-full lg:max-w-[50%] h-[500px] md:h-[600px] relative overflow-hidden bg-gray-100">
          <img
            key={currentTestimonial.id}
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
            alt={`${currentTestimonial.author} wearing ${currentTestimonial.product}`}
            src={currentTestimonial.image}
          />
        </div>

        {/* Navigation Right */}
        <button
          onClick={handleNext}
          aria-label="Next testimonial"
          className="hidden lg:flex flex-shrink-0 w-12 h-12 items-center justify-center hover:bg-gray-200 rounded-full transition-colors mx-4"
        >
          <CaretRight className="w-8 h-8 text-gray-800" />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-3 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-black scale-125" : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
