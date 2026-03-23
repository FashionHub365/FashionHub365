import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "./Icons";

export const FooterSection = () => {
  const [email, setEmail] = useState("");

  const footerSections = [
    {
      title: "Acount",
      links: [
        { label: "Log In", href: "/login" },
        { label: "Sign Up", href: "/register" },
        { label: "Redeem a Gift Card", href: "/" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Environmental Initiatives", href: "/" },
        { label: "Factories", href: "/" },
        { label: "DEI", href: "/" },
        { label: "Careers", href: "/" },
        { label: "International", href: "/" },
        { label: "Accessibility", href: "/" },
      ],
    },
    {
      title: "Get Help",
      links: [
        { label: "Help Center", href: "/" },
        { label: "Return Policy", href: "/" },
        { label: "Shipping Info", href: "/" },
        { label: "Bulk Orders", href: "/" },
      ],
    },
    {
      title: "Connect",
      links: [
        { label: "Facebook", href: "/" },
        { label: "Instagram", href: "/" },
        { label: "Twitter", href: "/" },
        { label: "Affiliates", href: "/" },
        { label: "Out Stores", href: "/stores" },
      ],
    },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/" },
    { label: "Terms of Service", href: "/" },
    { label: "Do Not Sell or Share My Personal Information", href: "/" },
    { label: "CS Supply Chain Transparency", href: "/" },
    { label: "Vendor Code of Conduct", href: "/" },
    { label: "Sitemap Pages", href: "/" },
    { label: "Sitemap Products", href: "/" },
  ];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <footer className="flex flex-col items-center pt-10 pb-0 px-4 md:px-[72px] relative self-stretch w-full flex-[0_0_auto] bg-x-100">
      <div className="flex flex-wrap md:flex-nowrap items-start relative self-stretch w-full flex-[0_0_auto]">
        {footerSections.map((section, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-5 p-5 relative w-1/2 md:flex-1 grow"
          >
            <h3 className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
              {section.title}
            </h3>

            <nav className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
              {section.links.map((link, linkIndex) => (
                <Link
                  key={linkIndex}
                  to={link.href}
                  className={`relative self-stretch ${linkIndex === 0 ? "mt-[-1.00px]" : ""} font-text-300 font-[number:var(--text-300-font-weight)] text-x-300 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] hover:underline focus:outline-none focus:underline`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}

        <form
          onSubmit={handleEmailSubmit}
          className="flex w-full md:w-auto items-start p-5 relative flex-[0_0_auto]"
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
            className="flex w-full md:w-[390px] items-center gap-2.5 px-[15px] py-[18px] relative mt-[-1.00px] mb-[-1.00px] ml-[-1.00px] bg-white border border-solid border-x-200 font-text-300 font-[number:var(--text-300-font-weight)] text-x-300 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)] focus:outline-none focus:border-x-500"
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
          className="flex flex-wrap items-start justify-center gap-4 md:gap-6 relative self-stretch w-full flex-[0_0_auto]"
          aria-label="Legal links"
        >
          {legalLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)] hover:underline focus:outline-none focus:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
          © 2023 All Rights Reserved
        </p>
      </div>
    </footer>
  );
};
