import { CaretLeft, CaretRight, ShoppingCartSimple } from "../Icons";



const galleryImages = [
  { id: 1, image: "/textures/landingpage/frame-14.jpg" },
  { id: 2, image: "/textures/landingpage/frame-15.jpg" },
  { id: 3, image: "/textures/landingpage/frame-16.jpg" },
  { id: 4, image: "/textures/landingpage/frame-17.jpg" },
  { id: 5, image: "/textures/landingpage/frame-18.jpg" },
];

export const CategoryNavigationSection = () => {
  return (
    <section className="flex-col items-center gap-3 px-[42px] py-0 flex relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-center gap-[25px] pt-[90px] pb-0 px-[54px] relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-x-500">
        <h2 className="relative self-stretch font-display-200 font-[number:var(--display-200-font-weight)] text-x-500 text-[length:var(--display-200-font-size)] text-center tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
          Everlane On You
        </h2>

        <div className="flex flex-col items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative self-stretch mt-[-1.00px] font-text-300 font-[number:var(--text-300-font-weight)] text-x-500 text-[length:var(--text-300-font-size)] text-center tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
            Share your latest look with #EverlaneOnYou for a chance to be
            featured.
          </p>

          <button className="relative self-stretch font-text-300-underline font-[number:var(--text-300-underline-font-weight)] text-x-500 text-[length:var(--text-300-underline-font-size)] text-center tracking-[var(--text-300-underline-letter-spacing)] leading-[var(--text-300-underline-line-height)] underline [font-style:var(--text-300-underline-font-style)] bg-transparent border-0 cursor-pointer">
            Add Your Photo
          </button>
        </div>
      </div>

      <div className="flex items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
        <button
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer"
          aria-label="Previous images"
        >
          <CaretLeft className="!relative !w-10 !h-10" />
        </button>

        {galleryImages.map((item) => (
          <div
            key={item.id}
            className="flex h-[225px] items-start justify-end gap-2.5 p-2.5 relative flex-1 grow bg-cover bg-[50%_50%]"
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <button
              className="relative w-[30px] h-[30px] bg-white rounded-[15px] border-0 cursor-pointer"
              aria-label="Add to cart"
            >
              <ShoppingCartSimple className="!absolute !w-[66.67%] !h-[66.67%] !top-[16.67%] !left-[16.67%]" />
            </button>
          </div>
        ))}

        <button
          className="inline-flex items-center justify-center gap-2.5 relative self-stretch flex-[0_0_auto] bg-transparent border-0 cursor-pointer"
          aria-label="Next images"
        >
          <CaretRight className="!relative !w-10 !h-10" />
        </button>
      </div>
    </section>
  );
};
