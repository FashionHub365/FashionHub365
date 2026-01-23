export const StoresListingSection = () => {
  const storesData = [
    [
      { city: "SEATTLE", location: "University Village", image: "/textures/storespage/image.jpg" },
      { city: "SAN FRANCISCO", location: "Valencia Street, San Francisco", image: "/textures/storespage/image1.jpg" },
      { city: "PALO ALTO", location: "Stanford", image: "/textures/storespage/image2.jpg" },
    ],
    [
      { city: "LOS ANGELES", location: "Abbot Kinney", image: "/textures/storespage/image3.jpg" },
      { city: "BOSTON", location: "Seaport", image: "/textures/storespage/image4.jpg" },
      { city: "NEW YORK", location: "Prince Street, New York", image: "/textures/storespage/image5.jpg" },
    ],
    [
      { city: "BROOKLYN", location: "Williamsburg", image: "/textures/storespage/image6.jpg" },
      { city: "KING OF PRUSSIA", location: "King of Prussia", image: "/textures/storespage/image7.jpg" },
      { city: "GEORGETOWN", location: "Georgetown", image: "/textures/storespage/image8.jpg" },
    ],
  ];

  return (
    <section className="flex flex-col items-center gap-16 px-[35px] py-[30px] relative self-stretch w-full flex-[0_0_auto]">
      <header className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <h2 className="relative self-stretch mt-[-1.00px] font-display-200 font-[number:var(--display-200-font-weight)] text-x-600 text-[length:var(--display-200-font-size)] text-center tracking-[var(--display-200-letter-spacing)] leading-[var(--display-200-line-height)] [font-style:var(--display-200-font-style)]">
          Stores
        </h2>

        <p className="relative self-stretch font-text-400 font-[number:var(--text-400-font-weight)] text-x-600 text-[length:var(--text-400-font-size)] text-center tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
          Find one of our 9 stores nearest you.
        </p>
      </header>

      {storesData.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-start gap-[30px] relative self-stretch w-full flex-[0_0_auto]"
        >
          {row.map((store, storeIndex) => (
            <article
              key={storeIndex}
              className="flex flex-col items-start gap-2 relative flex-1 grow"
            >
              <img
                className="relative self-stretch w-full h-[280px] object-cover"
                alt={`${store.city} - ${store.location}`}
                src={store.image}
              />

              <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
                <h3 className="self-start mt-[-1.00px] text-[length:var(--text-100-font-size)] tracking-[var(--text-100-letter-spacing)] leading-[var(--text-100-line-height)] font-text-100 text-x-600">
  {store.city}
</h3>

<p className="self-start font-text-400 text-x-600 text-[length:var(--text-400-font-size)] tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)]">
  {store.location}
</p>
              </div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
};
