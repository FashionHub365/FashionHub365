import { FooterSection } from "../components/FooterSection";
import { HeaderSection } from "../components/HeaderSection";
import { HeroSection } from "../components/BlogPage/HeroSection";
import { LatestArticlesSection } from "../components/BlogPage/LatestArticlesSection";
import { ProgressSection } from "../components/BlogPage/ProgressSection";
import { ProgressWrapperSection } from "../components/BlogPage/ProgressWrapperSection";

export const Blog = () => {
  return (
    <div className="flex flex-col items-start justify-end relative bg-white">
      <HeaderSection />
      <HeroSection />
      <LatestArticlesSection />
      <img
        className="h-[225px] relative self-stretch w-full object-cover"
        alt="Image"
        src="/textures/blogpage/image6.jpg"
      />
      <ProgressWrapperSection />
      <ProgressSection />
      <FooterSection />
    </div>
  );
};
