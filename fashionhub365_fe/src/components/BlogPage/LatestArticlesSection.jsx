export const LatestArticlesSection = () => {
  const articlesRow1 = [
    {
      id: 1,
      image: "/textures/blogpage/image.jpg",
      title: "How To Style Winter Whites",
      category: "Style",
    },
    {
      id: 2,
      image: "/textures/blogpage/image1.jpg",
      title: "We Won A Glossy Award",
      category: "Transparency",
    },
    {
      id: 3,
      image: "/textures/blogpage/image2.jpg",
      title: "Coordinate Your Style: Matching Outfits for Everyone",
      category: "Style",
    },
  ];

  const articlesRow2 = [
    {
      id: 4,
      image: "/textures/blogpage/image3.jpg",
      title: "Black Friday Fund 2023",
      category: "Transparency",
    },
    {
      id: 5,
      image: "/textures/blogpage/image4.jpg",
      title: "What to Wear this Season: Holiday Outfits & Ideas",
      category: "Style",
    },
    {
      id: 6,
      image: "/textures/blogpage/image5.jpg",
      title: "Thanksgiving Outfit Ideas",
      category: "Style",
    },
  ];

  return (
    <section className="gap-3 px-[60px] py-[120px] flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-600-demi font-[number:var(--display-600-demi-font-weight)] text-x-600 text-[length:var(--display-600-demi-font-size)] tracking-[var(--display-600-demi-letter-spacing)] leading-[var(--display-600-demi-line-height)] [font-style:var(--display-600-demi-font-style)]">
        The Latest
      </h2>

      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-[120px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            {articlesRow1.map((article) => (
              <article
                key={article.id}
                className="flex flex-col items-start gap-5 relative flex-1 grow"
              >
                <img
                  className="h-[413px] relative self-stretch w-full object-cover"
                  alt={article.title}
                  src={article.image}
                />

                <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <h3 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
                    {article.title}
                  </h3>

                  <span className="inline-flex items-center justify-center gap-2.5 px-5 py-1 relative flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] rounded-[30px] border border-solid border-x-200">
                    <span className="relative w-fit font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-600 text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                      {article.category}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            {articlesRow2.map((article) => (
              <article
                key={article.id}
                className="flex flex-col items-start gap-5 relative flex-1 grow"
              >
                <img
                  className="h-[413px] relative self-stretch w-full object-cover"
                  alt={article.title}
                  src={article.image}
                />

                <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <h3 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
                    {article.title}
                  </h3>

                  <span className="inline-flex items-center justify-center gap-2.5 px-5 py-1 relative flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] rounded-[30px] border border-solid border-x-200">
                    <span className="relative w-fit font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-600 text-[length:var(--text-200-demi-font-size)] text-center tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                      {article.category}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button
          className="all-[unset] box-border bg-x-500 flex w-60 items-center justify-center gap-2.5 px-[100px] py-5 relative flex-[0_0_auto] rounded-lg"
          type="button"
          aria-label="Load more articles"
        >
          <span className="relative w-fit mt-[-1.00px] ml-[-43.00px] mr-[-43.00px] font-text-300-demi font-[number:var(--text-300-demi-font-weight)] text-white text-[length:var(--text-300-demi-font-size)] text-center tracking-[var(--text-300-demi-letter-spacing)] leading-[var(--text-300-demi-line-height)] whitespace-nowrap [font-style:var(--text-300-demi-font-style)]">
            Load more Articals
          </span>
        </button>
      </div>
    </section>
  );
};
