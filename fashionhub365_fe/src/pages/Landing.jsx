import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import VoucherShelfSection from "../components/Voucher/VoucherShelfSection";
import voucherApi from "../apis/voucherApi";
import { useAuth } from "../contexts/AuthContext";

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [claimingVoucherId, setClaimingVoucherId] = useState("");
  const [claimedCodes, setClaimedCodes] = useState(new Set());

  useEffect(() => {
    let active = true;

    const fetchFeaturedVouchers = async () => {
      try {
        const res = await voucherApi.getActiveVouchers({ status: "active", limit: 6 });
        if (!active || !res.success) return;
        const items = res.data?.items || res.data || res.items || [];
        const normalizedItems = Array.isArray(items) ? items : [];
        setVouchers(normalizedItems);
        setClaimedCodes(new Set(normalizedItems.filter((voucher) => voucher.isClaimed).map((voucher) => voucher.code)));
      } catch (error) {
        if (active) {
          setVouchers([]);
        }
      }
    };

    fetchFeaturedVouchers();

    return () => {
      active = false;
    };
  }, [user]);

  const platformAndFeaturedVouchers = useMemo(() => vouchers, [vouchers]);

  const handleClaimVoucher = async (voucher) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const voucherId = voucher?._id || voucher?.uuid;
    if (!voucherId) return;

    setClaimingVoucherId(voucherId);
    try {
      await voucherApi.claimVoucher(voucherId);
      setClaimedCodes((prev) => new Set([...prev, voucher.code]));
    } finally {
      setClaimingVoucherId("");
    }
  };

  return (
    <main className="flex flex-col items-start relative bg-white">
      <CampaignBannersSection />
      <FlashSaleSection />
      <NewArrivalsSection />
      <CustomerReviewsSection />
      <FeaturedCollectionsSection />
      <VoucherShelfSection
        title="Claim vouchers right on the homepage"
        description="Pick up platform and campaign vouchers here, save them to your wallet, then apply them later during checkout."
        vouchers={platformAndFeaturedVouchers}
        claimedCodes={claimedCodes}
        claimingVoucherId={claimingVoucherId}
        emptyMessage="Featured vouchers will appear here when campaigns are active."
        onClaimVoucher={handleClaimVoucher}
        onOpenWallet={() => navigate("/profile", { state: { tab: "vouchers" } })}
      />
      <PromotionalBannersSection />
      <ProductHighlightsSection />
      <MissionStatementSection />
      <HeroBannerSection />
      <CategoryNavigationSection />
      <FeaturedProductsSection />
    </main>
  );
};
