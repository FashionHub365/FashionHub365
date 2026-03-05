import { Link } from "react-router-dom";

export const CustomerReviewsSection = () => {
  const categories = [
    { image: "/textures/landingpage/image-2.jpg", label: "JEANS", slug: "jeans" },
    { image: "/textures/landingpage/image-3.jpg", label: "JACKETS", slug: "jackets" },
    { image: "/textures/landingpage/image-4.jpg", label: "SNEAKERS", slug: "sneakers" },
    { image: "/textures/landingpage/image-5.jpg", label: "BOOTS", slug: "boots" },
    { image: "/textures/landingpage/image-6.jpg", label: "MEN ACCESSORIES", slug: "men-accessories" },
  ];

  return (
    <section className="flex-col items-center gap-[25px] px-[42px] py-[90px] flex relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-x-500 text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
        Shop by Category
      </h2>

      <nav
        className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]"
        aria-label="Product categories"
      >
        {categories.map((category, index) => (
          <Link
            key={index}
            to={`/listing?category=${category.slug}`}
            className="flex flex-col items-center gap-3 relative flex-1 grow no-underline"
            aria-label={`Shop ${category.label}`}
          >
            <img
              className="relative self-stretch w-full h-[263px] object-cover"
              alt={`${category.label} category`}
              src={category.image}
            />

            <span className="relative self-stretch font-text-300-underline font-[number:var(--text-300-underline-font-weight)] text-x-500 text-[length:var(--text-300-underline-font-size)] text-center tracking-[var(--text-300-underline-letter-spacing)] leading-[var(--text-300-underline-line-height)] underline [font-style:var(--text-300-underline-font-style)]">
              {category.label}
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
};
