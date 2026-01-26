import React from "react";
import { Download } from "../Icons";

export const TransparentPricingSection = () => {
    // Placeholder logic for pricing visualization as we don't have the SVGs for vectors
    const pricingData = [
      { label: "Materials", price: "$47.96", Image: "icon1.jpg" },
      { label: "Hardware", price: "$5.74", Image: "icon2.jpg" },
      { label: "Labor", price: "$13.75", Image: "icon3.jpg" },
      { label: "Duties", price: "$8.09", Image: "icon4.jpg" },
      { label: "Transport", price: "$1.53", Image: "icon5.jpg" },
    ];
  
    return (
      <section className="flex-col items-center gap-4 p-20 flex relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col w-[684px] items-center gap-4 relative flex-[0_0_auto]">
          <h2 className="relative self-stretch mt-[-1.00px] font-display-100-demi font-[number:var(--display-100-demi-font-weight)] text-x-500 text-[length:var(--display-100-demi-font-size)] text-center tracking-[var(--display-100-demi-letter-spacing)] leading-[var(--display-100-demi-line-height)] [font-style:var(--display-100-demi-font-style)]">
            Transparent Pricing
          </h2>
  
          <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
            We publish what it costs us to make every one of our products. There
            are a lot of costs we can&#39;t neatly account for - like design,
            fittings, wear testing, rent on office and retail space - but we
            believe you deserve to know what goes into making the products you
            love.
          </p>
        </div>
  
        <div className="flex w-[684px] items-start justify-center gap-8 relative flex-[0_0_auto]">
          {pricingData.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 p-6 relative flex-1 grow"
            >
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center p-3"
              >
                 <img src={`/textures/productdetailpage/${item.Image}`} alt={item.label} className="w-full h-full object-contain"/> 
              </div>
  
              <div className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                {item.label}
                <br />
                {item.price}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };
