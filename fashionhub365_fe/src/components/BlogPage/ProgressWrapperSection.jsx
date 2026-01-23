export const ProgressWrapperSection = () => {
  const progressItems = [
    {
      id: "carbon-commitment",
      image: "/textures/blogpage/image7.jpg",
      title: "Carbon Commitment",
    },
    {
      id: "environmental-initiatives",
      image: "/textures/blogpage/image8.jpg",
      title: "Environmental Initiatives",
    },
    {
      id: "better-factories",
      image: "/textures/blogpage/image9.jpg",
      title: "Better Factories",
    },
  ];

  return (
    <section className="gap-3 px-[60px] py-[120px] flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-600-demi font-[number:var(--display-600-demi-font-weight)] text-x-600 text-[length:var(--display-600-demi-font-size)] tracking-[var(--display-600-demi-letter-spacing)] leading-[var(--display-600-demi-line-height)] [font-style:var(--display-600-demi-font-style)]">
        Our Progress
      </h2>

      <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
        {progressItems.map((item) => (
          <article
            key={item.id}
            className="flex flex-col items-start gap-3 relative flex-1 grow"
          >
            <img
              className="h-[306px] relative self-stretch w-full object-cover"
              alt={item.title}
              src={item.image}
            />

            <h3 className="relative self-stretch font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
              {item.title}
            </h3>
          </article>
        ))}
      </div>
    </section>
  );
};
