import React, { useState } from "react";
import { Download, Star } from "../Icons";

export const ProductDetailsSection = () => {
  const productImages = [
    { id: 1, src: "/textures/productdetailpage/image.jpg", alt: "Product image 1" },
    { id: 2, src: "/textures/productdetailpage/image2.jpg", alt: "Product image 2" },
    { id: 3, src: "/textures/productdetailpage/image3.jpg", alt: "Product image 3" },
    { id: 4, src: "/textures/productdetailpage/image4.jpg", alt: "Product image 4" },
    { id: 5, src: "/textures/productdetailpage/image5.jpg", alt: "Product image 5" },
    { id: 6, src: "/textures/productdetailpage/image6.jpg", alt: "Product image 6" },
  ];

  const colors = [
    { id: 1, name: "Navy Blue", color: "#103080" },
    { id: 2, name: "Brown", color: "#7c3c0e" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const features = [
    {
      id: 1,
      icon: "/textures/productdetailpage/ship.jpg",
      title: "Free Shipping",
      description: "On all U.S. orders over $100",
    },
    {
      id: 2,
      icon: "/textures/productdetailpage/return.jpg",
      title: "Easy Returns",
      description: "Extended returns through January 31",
    },
    {
      id: 3,
      icon: "/textures/productdetailpage/gift.jpg",
      title: "Send It As A Gift",
      description: "Add a free personalized note during checkout",
    },
  ];

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);

  return (
    <section className="items-start gap-6 px-20 py-[30px] flex relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start gap-2 relative flex-1 grow">
        {[0, 2, 4].map((startIndex) => (
          <div
            key={startIndex}
            className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]"
          >
            {productImages
              .slice(startIndex, startIndex + 2)
              .map((img, index) => (
                <div
                  key={img.id}
                  className="flex h-[508px] items-start gap-2.5 relative flex-1 grow"
                >
                  <img
                    className="flex-1 grow relative self-stretch object-cover"
                    alt={img.alt}
                    src={img.src}
                  />
                  {startIndex === 0 && index === 0 && (
                    <div className="inline-flex items-center justify-center gap-2.5 px-1.5 py-1 absolute top-2 left-2 bg-white">
                      <div className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-red text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                        30% off
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>

      <aside className="flex flex-col w-96 items-start gap-px relative">
        <header className="flex flex-col items-start gap-1 pt-0 pb-4 px-0 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-100">
          <nav aria-label="Breadcrumb">
            <p className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              Men / Outerwear - Jackets &amp; Coats
            </p>
          </nav>

          <div className="flex items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <h1 className="relative text-left flex-1 mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
              The ReWool® Oversized Shirt Jacket
            </h1>

            <div className="inline-flex items-center justify-end gap-1 relative flex-[0_0_auto]">
              <span className="w-fit font-display-100-strikethrough text-x-300 text-[length:var(--display-100-strikethrough-font-size)] tracking-[var(--display-100-strikethrough-letter-spacing)] leading-[var(--display-100-strikethrough-line-height)] line-through whitespace-nowrap relative mt-[-1.00px] font-[number:var(--display-100-strikethrough-font-weight)] [font-style:var(--display-100-strikethrough-font-style)]">
                $238
              </span>

              <span className="w-fit font-display-100 text-x-600 text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] whitespace-nowrap relative mt-[-1.00px] font-[number:var(--display-100-font-weight)] [font-style:var(--display-100-font-style)]">
                $167
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <div
              className="inline-flex items-center gap-1 relative flex-[0_0_auto]"
              role="img"
              aria-label="5 out of 5 stars"
            >
              {[...Array(5)].map((_, index) => (
                <Star key={index} className="!relative !w-3 !h-3" />
              ))}
            </div>

            <span className="text-sm text-x-500">5.0 (2 reviews)</span>
          </div>
        </header>

        <div className="flex flex-col items-start gap-2.5 px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
             <span className="font-text-200">Color: {colors[selectedColor].name}</span>
          </div>

          <fieldset className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <legend className="sr-only">Select color</legend>
            {colors.map((colorOption, index) => (
              <button
                key={colorOption.id}
                type="button"
                onClick={() => setSelectedColor(index)}
                className={`relative w-8 h-8 rounded-2xl border border-solid ${
                  selectedColor === index ? "border-x-600" : "border-x-200"
                }`}
                aria-label={`Select ${colorOption.name} color`}
                aria-pressed={selectedColor === index}
              >
                <div
                  className={`h-full rounded-2xl`}
                  style={{ backgroundColor: colorOption.color, border: "2px solid white" }}
                />
              </button>
            ))}
          </fieldset>
        </div>

        <div className="flex flex-col items-start gap-2.5 px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
             <span className="font-text-200">Size</span>
             <span className="font-text-200 underline">Size Guide</span>
          </div>

          <fieldset className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <legend className="sr-only">Select size</legend>
            {sizes.map((sizeOption) => (
              <button
                key={sizeOption}
                type="button"
                onClick={() => setSelectedSize(sizeOption)}
                className={`flex w-[45px] items-center justify-center gap-2.5 p-3 relative ${
                  selectedSize === sizeOption ? "bg-x-500" : "bg-x-100"
                }`}
                aria-label={`Select size ${sizeOption}`}
                aria-pressed={selectedSize === sizeOption}
              >
                <span
                  className={`relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)] ${
                    selectedSize === sizeOption ? "text-white" : "text-x-500"
                  }`}
                >
                  {sizeOption}
                </span>
              </button>
            ))}
          </fieldset>
        </div>

        <div className="flex flex-col items-center justify-center gap-2.5 px-0 py-8 relative self-stretch w-full flex-[0_0_auto]">
          <button
            type="button"
            className="all-[unset] box-border flex items-center justify-center gap-2.5 px-0 py-3 relative self-stretch w-full flex-[0_0_auto] bg-x-500 cursor-pointer"
            aria-label="Add to bag"
          >
            <span className="relative w-fit mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-white text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] whitespace-nowrap [font-style:var(--text-300-font-style)]">
              ADD TO BAG
            </span>
          </button>
        </div>

        <div className="flex flex-col items-start gap-6 px-0 py-6 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200">
          {features.map((feature) => {
            return (
              <div
                key={feature.id}
                className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]"
              >
                <img src={feature.icon} alt={feature.title} className="relative w-[34px] h-[34px] object-contain" />
                <div className="flex flex-col items-start relative flex-1 grow">
                  <span className="font-text-200 font-bold">{feature.title}</span>
                  <span className="font-text-200">{feature.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        <article className="flex-col gap-4 pt-10 pb-3 px-0 ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-200 flex items-start relative self-stretch w-full flex-[0_0_auto]">
          <span className="font-text-200 font-bold">Part shirt, part jacket, all style.</span>
          <p className="font-text-200 text-left" >
            Meet your new chilly weather staple. The ReWool® Oversized Shirt Jacket has all the classic shirt detailing...
          </p>
        </article>

        <div className="flex items-center text-left px-0 py-5 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
          <span className="font-text-200 font-bold w-20">Model</span>
          <span className="font-text-200">Model is 6'2" wearing a size M</span>
        </div>

        <div className="flex items-start text-left px-0 py-5 relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
           <span className="font-text-200 font-bold w-20">Fit</span>
           <span className="font-text-200">Questions about fit? Contact Us</span>
        </div>

        <div className="flex flex-col items-start px-0 py-5 relative self-stretch w-full flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200">
           <span className="font-text-200 font-bold">Sustainability</span>
           <img src="/textures/productdetailpage/Sustainability.jpg" alt="Sustainability" className="mt-2 w-full object-contain" />
        </div>
      </aside>
    </section>
  );
};
