import { FooterSection } from "../components/FooterSection";
import { HeaderSection } from "../components/HeaderSection";
import { StoresListingSection } from "../components/StoresPage/StoresListingSection";

export const Stores = () => {
  return (
    <div className="flex flex-col items-start relative bg-white">
      <HeaderSection />
      <StoresListingSection />
      <FooterSection />
    </div>
  );
};
