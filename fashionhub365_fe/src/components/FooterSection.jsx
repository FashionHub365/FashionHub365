import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "./Icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FooterSection = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSuccessMessage(`Thanks. We'll send updates to ${email.trim()}.`);
    setEmail("");
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

        <div className="w-full md:w-auto p-5">
          <div className="rounded-[28px] border border-x-200 bg-white/90 p-5 shadow-sm md:w-[430px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-x-300">
              Email Updates
            </p>
            <h3 className="mt-3 font-text-400-demi text-x-500 text-[length:var(--text-400-demi-font-size)] leading-[var(--text-400-demi-line-height)]">
              Receive product drops, voucher news and member-only offers.
            </h3>
            <p className="mt-2 text-sm text-x-300">
              Enter your email and we will keep the useful stuff in one place.
            </p>

            <form onSubmit={handleEmailSubmit} className="mt-5">
              <label htmlFor="email-input" className="sr-only">
                Email Address
              </label>
              <div className="flex items-stretch">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                    if (successMessage) setSuccessMessage("");
                  }}
                  placeholder="name@example.com"
                  className={`flex w-full items-center gap-2.5 rounded-l-2xl border px-[15px] py-[18px] font-text-300 text-x-500 focus:outline-none ${error ? "border-red-400" : "border-x-200 focus:border-x-500"}`}
                  aria-label="Email Address"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-r-2xl bg-x-500 px-4 text-white border border-x-500 hover:bg-x-400 focus:outline-none focus:ring-2 focus:ring-x-500 focus:ring-offset-2 transition-colors"
                  aria-label="Submit email"
                >
                  <ArrowRight className="!relative !w-6 !h-6 text-white" />
                </button>
              </div>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {successMessage && <p className="mt-2 text-sm text-emerald-600">{successMessage}</p>}
            </form>
          </div>
        </div>
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
