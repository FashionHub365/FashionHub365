import { CategoryNavigationSection } from "../components/LandingPage/CategoryNavigationSection";
import { CustomerReviewsSection } from "../components/LandingPage/CustomerReviewsSection";
import { FeaturedCollectionsSection } from "../components/LandingPage/FeaturedCollectionsSection";
import { FeaturedProductsSection } from "../components/LandingPage/FeaturedProductsSection";
import { FooterSection } from "../components/FooterSection";
import { HeaderSection } from "../components/HeaderSection";
import { HeroBannerSection } from "../components/LandingPage/HeroBannerSection";
import { MissionStatementSection } from "../components/LandingPage/MissionStatementSection";
import { NewArrivalsSection } from "../components/LandingPage/NewArrivalsSection";
import { ProductHighlightsSection } from "../components/LandingPage/ProductHighlightsSection";
import { PromotionalBannersSection } from "../components/LandingPage/PromotionalBannersSection";

export const Landing = () => {
  return (
    <main className="flex flex-col items-start relative bg-white">
      <HeaderSection />
      <NewArrivalsSection />
      <CustomerReviewsSection />
      <FeaturedCollectionsSection />
      <PromotionalBannersSection />
      <ProductHighlightsSection />
      <MissionStatementSection />
      <HeroBannerSection />
      <CategoryNavigationSection />
      <FeaturedProductsSection />
      <FooterSection />
    </main>
  );
};
