import React, { useState } from "react";
import { CaretLeft, CaretRight } from "../Icons";

export const ProductImageSection = () => {
  const products = [
    {
      id: 1,
      image: "/textures/blogpost/image5.jpg", // Placeholder
      name: "The Cashmere Boxy Crew Sweater",
      price: "$139",
      color: "Bone",
    },
    {
      id: 2,
      image: "/textures/blogpost/image6.jpg", 
      name: "The Corduroy Wide-Leg Pant",
      price: "$69",
      color: "Canvas",
    },
    {
      id: 3,
      image: "/textures/blogpost/image7.jpg",
      name: "The Organic Cotton Chunky Beanie",
      price: "$32",
      color: "Canvas",
    },
    {
      id: 4,
      image: "/textures/blogpost/image8.jpg",
      name: "The Chelsea Boot",
      price: "$137",
      color: "Off-White",
    },
    {
      id: 5,
      image: "/textures/blogpost/image9.jpg",
      name: "The Re:Down@Puffer",
      price: undefined,
      color: "Bone",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev));
  };

  return (
    <section className="flex-col items-center gap-10 p-[60px] flex-[0_0_auto] flex relative self-stretch w-full">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-400-demi font-[number:var(--display-400-demi-font-weight)] text-x-600 text-[length:var(--display-400-demi-font-size)] text-center tracking-[var(--display-400-demi-letter-spacing)] leading-[var(--display-400-demi-line-height)] [font-style:var(--display-400-demi-font-style)]">
        The White Whites Edit
      </h2>

      <div className="flex items-start justify-center gap-[22px] relative self-stretch w-full flex-[0_0_auto]">
        <button
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer disabled:opacity-50"
          onClick={handlePrevious}
          aria-label="Previous products"
          disabled={currentIndex === 0}
        >
          <CaretLeft className="!relative !w-10 !h-10" />
        </button>

        {products.slice(currentIndex, currentIndex + 3).map((product) => (
           <article
             key={product.id}
             className="flex flex-col items-center gap-1.5 relative flex-1 grow"
           >
             <img
               className="h-[350px] object-cover relative self-stretch w-full"
               alt={product.name}
               src={product.image}
             />
 
             <div className="flex flex-col items-start gap-[3px] relative self-stretch w-full flex-[0_0_auto]">
               <div
                 className={`flex items-start ${
                   product.price ? "gap-3" : "justify-around gap-3"
                 } relative self-stretch w-full flex-[0_0_auto]`}
               >
                 <h3
                   className="relative flex-1 mt-[-1.00px] text-left font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]"
                 >
                   {product.name}
                 </h3>
 
                 {product.price && (
                   <span className="relative w-fit mt-[-1.00px]  font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] text-right tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                     {product.price}
                   </span>
                 )}
               </div>
 
               <p className="relative self-stretch h-4 text-left font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                 {product.color}
               </p>
             </div>
           </article>
        ))}

        <button
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer disabled:opacity-50"
          onClick={handleNext}
          aria-label="Next products"
          disabled={currentIndex >= products.length - 3}
        >
          <CaretRight className="!relative !w-10 !h-10" />
        </button>
      </div>

      <button className="all-[unset] box-border flex w-60 items-center justify-center gap-2.5 px-[100px] py-5 relative flex-[0_0_auto] bg-x-500 rounded-lg cursor-pointer">
        <span className="relative w-fit mt-[-1.00px] ml-[-14.00px] mr-[-14.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-white text-[length:var(--text-300-demi-font-size)] text-center tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
          Shop Now
        </span>
      </button>
    </section>
  );
};
