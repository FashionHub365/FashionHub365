import React from "react";
import { IntroTextSection } from "../components/BlogPost/IntroTextSection";
import { MainContentSection } from "../components/BlogPost/MainContentSection";
import { ProductDescriptionSection } from "../components/BlogPost/ProductDescriptionSection";
import { ProductImageSection } from "../components/BlogPost/ProductImageSection";
import { RelatedProductsSection } from "../components/BlogPost/RelatedProductsSection";
import { Twitter, Facebook, Linkedin } from "../components/Icons";

export const BlogPost = () => {
  const socialMediaLinks = [
    { Component: Twitter, key: "twitter" },
    { Component: Facebook, key: "facebook" },
    { Component: Linkedin, key: "linkedin" },
  ];

  return (
    <div className="flex flex-col items-start relative bg-white w-full">
      <IntroTextSection />

      <section className="flex-col items-start gap-10 px-[60px] py-[115px] flex-[0_0_auto] flex relative self-stretch w-full">
        <div className="h-3.5 bg-x-600 relative self-stretch w-full" />

        <div className="flex items-start gap-[148px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
            {socialMediaLinks.map(({ Component, key }) => (
              <Component key={key} className="!relative !w-7 !h-7" />
            ))}
          </div>

          <p className="relative flex-1 mt-[-1.00px] font-display-400-demi font-[number:var(--display-400-demi-font-weight)] text-x-600 text-[length:var(--display-400-demi-font-size)] tracking-[var(--display-400-demi-letter-spacing)] leading-[var(--display-400-demi-line-height)] [font-style:var(--display-400-demi-font-style)]">
            In a season dominated by dark hues, redefine your winter wardrobe
            with the timeless elegance of winter whites. Whether top-to-toe
            white outfits, tonal mixing-and-matching, or a key white piece (or
            two), give your style a breath of fresh air with this list of winter
            white closet essentials.
          </p>
        </div>
      </section>

      <section className="items-center justify-center gap-2.5 px-[60px] py-[100px] flex-[0_0_auto] flex relative self-stretch w-full">
        <img
          className="relative w-[790px] h-[1054px] object-cover"
          alt="Image"
          src="/textures/blogpost/image1.jpg"
        />
      </section>

      <MainContentSection />

      <section className="items-center justify-center gap-2.5 px-[60px] py-[100px] flex-[0_0_auto] flex relative self-stretch w-full">
        <img
          className="relative w-[790px] h-[1054px] object-cover"
          alt="Image"
          src="/textures/blogpost/image2.jpg"
        />
      </section>

      <ProductDescriptionSection />
      <ProductImageSection />
      <RelatedProductsSection />
    </div>
  );
};
