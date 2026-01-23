export const TransparencyInfoSection = () => {
    const items = [
      {
        text: "Our Products",
        image: "/textures/aboutpage/image1.jpg",
      },
      {
        text: "Our Stores",
        image: "/textures/aboutpage/image2.jpg",
      },
      {
        text: "Careers",
        image: "/textures/aboutpage/image3.jpg",
      },
    ];
  
    return (
      <section className="flex flex-col items-center justify-center gap-[60px] px-[258px] py-[90px] relative self-stretch w-full flex-[0_0_auto]">
        <header className="flex flex-col items-center gap-3.5 relative self-stretch w-full flex-[0_0_auto]">
          <h2 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] text-center tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
            More to Explore
          </h2>
        </header>
  
        <div className="flex items-start justify-center gap-[30px] relative self-stretch w-full flex-[0_0_auto]">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-start gap-4 flex-1 grow relative"
            >
              <img
                className="relative self-stretch w-full h-[208.33px] object-cover"
                alt={item.text}
                src={item.image}
              />
              <div className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-600 text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };
