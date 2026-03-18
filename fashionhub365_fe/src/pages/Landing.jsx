import { CategoryNavigationSection } from "../components/LandingPage/CategoryNavigationSection";
import { CustomerReviewsSection } from "../components/LandingPage/CustomerReviewsSection";
import { FeaturedCollectionsSection } from "../components/LandingPage/FeaturedCollectionsSection";
import { FeaturedProductsSection } from "../components/LandingPage/FeaturedProductsSection";
import { HeroBannerSection } from "../components/LandingPage/HeroBannerSection";
import { MissionStatementSection } from "../components/LandingPage/MissionStatementSection";
import { NewArrivalsSection } from "../components/LandingPage/NewArrivalsSection";
import { ProductHighlightsSection } from "../components/LandingPage/ProductHighlightsSection";
import { PromotionalBannersSection } from "../components/LandingPage/PromotionalBannersSection";
import { FlashSaleSection } from "../components/LandingPage/FlashSaleSection";
import { CampaignBannersSection } from "../components/LandingPage/CampaignBannersSection";

export const Landing = () => {
  return (
    <main className="flex flex-col items-start relative bg-white">
      <CampaignBannersSection />
      <FlashSaleSection />
      <NewArrivalsSection />
      <CustomerReviewsSection />
      <FeaturedCollectionsSection />
      <PromotionalBannersSection />
      <ProductHighlightsSection />
      <MissionStatementSection />
      <HeroBannerSection />
      <CategoryNavigationSection />
      <FeaturedProductsSection />
    </main>
  );
};
