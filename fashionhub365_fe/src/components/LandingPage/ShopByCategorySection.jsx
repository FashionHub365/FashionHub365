import { Link } from "react-router-dom";

/**
 * ShopByCategorySection
 * Hiển thị 6 category với ảnh, khi click → chuyển tới /listing?category=<slug>
 */
const categories = [
    {
        label: "JEANS",
        slug: "jeans",
        image: "/textures/landingpage/frame-15.jpg",
    },
    {
        label: "JACKETS",
        slug: "jackets",
        image: "/textures/landingpage/frame-16.jpg",
    },
    {
        label: "SNEAKERS",
        slug: "sneakers",
        image: "/textures/landingpage/frame-17.jpg",
    },
    {
        label: "BOOTS",
        slug: "boots",
        image: "/textures/landingpage/frame-18.jpg",
    },
    {
        label: "MEN ACCESSORIES",
        slug: "men-accessories",
        image: "/textures/landingpage/frame-3.jpg",
    },
];



export const ShopByCategorySection = () => {
    return (
        <section
            className="flex flex-col items-center gap-8 px-[42px] py-[90px] relative self-stretch w-full flex-[0_0_auto]"
            aria-labelledby="shop-by-category-heading"
        >
            <h2
                id="shop-by-category-heading"
                className="relative self-stretch font-display-200 font-[number:var(--display-200-font-weight)] text-x-500 text-[length:var(--display-200-font-size)] text-center tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]"
            >
                Shop by Category
            </h2>

            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                {categories.map((cat) => (
                    <Link
                        key={cat.slug}
                        to={`/listing?category=${cat.slug}`}
                        className="flex flex-col items-center gap-3 relative flex-1 grow group no-underline"
                        aria-label={`Shop ${cat.label}`}
                    >
                        {/* Image */}
                        <div className="relative self-stretch w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
                            <img
                                src={cat.image}
                                alt={cat.label}
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>

                        {/* Label */}
                        <span className="relative w-fit font-text-300-underline font-[number:var(--text-300-underline-font-weight)] text-x-500 text-[length:var(--text-300-underline-font-size)] text-center tracking-[var(--text-300-underline-letter-spacing)] leading-[var(--text-300-underline-line-height)] underline whitespace-nowrap [font-style:var(--text-300-underline-font-style)] group-hover:text-x-400 transition-colors duration-200">
                            {cat.label}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};
