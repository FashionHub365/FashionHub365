import { useState } from "react";
import { ArrowRight } from "./Icons";

export const FooterSection = () => {
  const [email, setEmail] = useState("");

  const footerSections = [
    {
      title: "Acount",
      links: ["Log In", "Sign Up", "Redeem a Gift Card"],
    },
    {
      title: "Company",
      links: [
        "About",
        "Environmental Initiatives",
        "Factories",
        "DEI",
        "Careers",
        "International",
        "Accessibility",
      ],
    },
    {
      title: "Get Help",
      links: ["Help Center", "Return Policy", "Shipping Info", "Bulk Orders"],
    },
    {
      title: "Connect",
      links: ["Facebook", "Instagram", "Twitter", "Affiliates", "Out Stores"],
    },
  ];

  const legalLinks = [
    "Privacy Policy",
    "Terms of Service",
    "Do Not Sell or Share My Personal Information",
    "CS Supply Chain Transparency",
    "Vendor Code of Conduct",
    "Sitemap Pages",
    "Sitemap Products",
  ];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <footer className="flex flex-col items-center pt-10 pb-0 px-[72px] relative self-stretch w-full flex-[0_0_auto] bg-x-100">
      <div className="flex items-start relative self-stretch w-full flex-[0_0_auto]">
        {footerSections.map((section, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-5 p-5 relative flex-1 grow"
          >
            <h3 className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
              {section.title}
            </h3>

            <nav className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
              {section.links.map((link, linkIndex) => (
                <a
                  key={linkIndex}
                  href="#"
                  className={`relative self-stretch ${linkIndex === 0 ? "mt-[-1.00px]" : ""} font-text-300 font-[number:var(--text-300-font-weight)] text-x-300 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] hover:underline focus:outline-none focus:underline`}
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>
        ))}

        <form
          onSubmit={handleEmailSubmit}
          className="inline-flex items-start p-5 relative flex-[0_0_auto]"
        >
          <label htmlFor="email-input" className="sr-only">
            Email Address
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="flex w-[390px] items-center gap-2.5 px-[15px] py-[18px] relative mt-[-1.00px] mb-[-1.00px] ml-[-1.00px] bg-white border border-solid border-x-200 font-text-300 font-[number:var(--text-300-font-weight)] text-x-300 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] focus:outline-none focus:border-x-500"
            aria-label="Email Address"
          />
          <button
            type="submit"
            className="inline-flex items-start gap-2.5 px-3.5 py-[14.5px] relative flex-[0_0_auto] mt-[-2.00px] mb-[-2.00px] mr-[-2.00px] bg-x-500 border border-solid border-x-500 hover:bg-x-400 focus:outline-none focus:ring-2 focus:ring-x-500 focus:ring-offset-2 transition-colors"
            aria-label="Submit email"
          >
            <ArrowRight className="!relative !w-6 !h-6 !mt-[-1.00px] !ml-[-1.00px] text-white" />
          </button>
        </form>
      </div>

      <div className="flex flex-col items-center gap-4 px-0 py-4 relative self-stretch w-full flex-[0_0_auto]">
        <nav
          className="flex items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]"
          aria-label="Legal links"
        >
          {legalLinks.map((link, index) => (
            <a
              key={index}
              href="#"
              className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)] hover:underline focus:outline-none focus:underline"
            >
              {link}
            </a>
          ))}
        </nav>

        <p className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          © 2023 All Rights Reserved
        </p>
      </div>
    </footer>
  );
};
