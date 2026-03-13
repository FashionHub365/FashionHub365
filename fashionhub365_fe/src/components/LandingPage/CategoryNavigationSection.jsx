import { useState, useEffect } from "react";
import { CaretLeft, CaretRight, ShoppingCartSimple } from "../Icons";

const galleryImages = [
  { id: 1, image: "/textures/landingpage/frame-14.jpg" },
  { id: 2, image: "/textures/landingpage/frame-15.jpg" },
  { id: 3, image: "/textures/landingpage/frame-16.jpg" },
  { id: 4, image: "/textures/landingpage/frame-17.jpg" },
  { id: 5, image: "/textures/landingpage/frame-18.jpg" },
  { id: 6, image: "/textures/landingpage/frame-1.jpg" },
  { id: 7, image: "/textures/landingpage/frame-2.jpg" },
  { id: 8, image: "/textures/landingpage/frame-7.jpg" },
  { id: 9, image: "/textures/landingpage/frame-8.jpg" },
  { id: 10, image: "/textures/landingpage/image-9.jpg" },
];

export const CategoryNavigationSection = () => {
  const [startIndex, setStartIndex] = useState(0);
  // Show 5 items on lg screens, maybe less on mobile. Will slice from startIndex
  const itemsToShow = 5;

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1 >= galleryImages.length - itemsToShow + 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 < 0 ? galleryImages.length - itemsToShow : prev - 1));
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStartIndex((prev) => (prev + 1 >= galleryImages.length - itemsToShow + 1 ? 0 : prev + 1));
    }, 4000); // Auto-slide every 4 seconds

    return () => clearInterval(intervalId);
  }, []);

  const visibleImages = galleryImages.slice(startIndex, startIndex + itemsToShow);

  // If not enough images at end, loop back
  while (visibleImages.length < itemsToShow) {
    visibleImages.push(galleryImages[visibleImages.length - (galleryImages.length - startIndex)]);
  }

  return (
    <section className="flex flex-col items-center gap-10 px-6 md:px-12 py-16 w-full max-w-[1400px] mx-auto bg-white border-t border-gray-200">
      <div className="flex flex-col items-center gap-3 w-full text-center">
        <h2 className="font-display-200 text-gray-900 text-[26px] md:text-[32px] tracking-wide">
          Everlane On You
        </h2>

        <p className="font-text-200 text-gray-700 text-[15px] tracking-wide max-w-[500px]">
          Share your latest look with #EverlaneOnYou for a chance to be featured.
          <br />
          <button type="button" className="underline hover:text-black font-semibold mt-1 inline-block transition-colors bg-transparent border-0 cursor-pointer p-0 font-text-200">
            Add Your Photo
          </button>
        </p>
      </div>

      <div className="flex items-center gap-4 w-full relative">
        <button
          onClick={handlePrev}
          className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Previous images"
        >
          <CaretLeft className="w-8 h-8 text-gray-800" />
        </button>

        <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-hidden">
          {visibleImages.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative aspect-square w-full overflow-hidden group bg-gray-100 animate-fade-in"
            >
              <img
                src={item.image}
                alt="User generated content"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <button
                className="absolute top-3 right-3 w-[36px] h-[36px] bg-white rounded-full shadow-md flex items-center justify-center text-gray-800 opacity-90 hover:opacity-100 hover:scale-110 transition-all z-10"
                aria-label="Shop this look"
              >
                <ShoppingCartSimple className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Next images"
        >
          <CaretRight className="w-8 h-8 text-gray-800" />
        </button>
      </div>
    </section>
  );
};
