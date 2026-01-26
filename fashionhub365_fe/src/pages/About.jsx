import { BrandStorySection } from "../components/AboutPage/BrandStorySection";
import { EthicalApproachSection } from "../components/AboutPage/EthicalApproachSection";
import { ProductShowcaseSection } from "../components/AboutPage/ProductShowcaseSection";
import { ProductionProcessSection } from "../components/AboutPage/ProductionProcessSection";
import { TransparencyInfoSection } from "../components/AboutPage/TransparencyInfoSection";
import { HeaderSection } from "../components/HeaderSection";
import { FooterSection } from "../components/FooterSection";

export const About = () => {
  return (
    <div className="flex flex-col items-center relative bg-white w-full">
      <HeaderSection />
      <BrandStorySection />
      <section className="items-center justify-center gap-2.5 px-[258px] py-[76px] flex-[0_0_auto] flex relative self-stretch w-full">
        <p className="relative flex-1 mt-[-1.00px] font-display-300 font-[number:var(--display-300-font-weight)] text-x-600 text-[length:var(--display-300-font-size)] text-center tracking-[var(--display-300-letter-spacing)] leading-[var(--display-300-line-height)] [font-style:var(--display-300-font-style)]">
          At Everlane, we want the right choice to be as easy as putting on a
          great T-shirt. That&apos;s why we partner with the best, ethical
          factories around the world. Source only the finest materials. And
          share those stories with you—down to the true cost of every product we
          make. It&apos;s a new way of doing things. We call it Radical
          Transparency.
        </p>
      </section>

      <EthicalApproachSection />
      <img
        className="w-[1400] h-[637px] relative self-stretch object-cover"
        alt="Image"
        src="/textures/aboutpage/image7.jpg"
      />

      <ProductionProcessSection />
      <img
        className="w-full h-[560px] relative self-stretch object-cover"
        alt="Image"
        src="/textures/aboutpage/image5.jpg"
      />

      <ProductShowcaseSection />
      <TransparencyInfoSection />
      <FooterSection />
    </div>
  );
};
