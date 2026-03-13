import { Link } from "react-router-dom";

export const FeaturedCollectionsSection = () => {
  const collections = [
    {
      id: 1,
      topTitle: "Our Holiday Gift Picks",
      bottomText: "The best presents for everyone on your list.",
      image: "/textures/landingpage/frame-1.jpg",
      link: "/listing?sort=best_sellers",
    },
    {
      id: 2,
      topTitle: "Cleaner Fashion",
      bottomText: "See the sustainability efforts behind each of our products.",
      image: "/textures/landingpage/frame-2.jpg",
      link: "/listing?category=conscious",
    },
  ];

  return (
    <section className="flex flex-col md:flex-row items-start justify-center gap-8 px-6 md:px-12 py-16 w-full max-w-[1400px] mx-auto bg-white">
      {collections.map((collection) => (
        <article
          key={collection.id}
          className="flex flex-col items-center gap-4 flex-1 w-full"
        >
          <h2 className="font-text-200 text-[20px] md:text-[24px] text-gray-900 tracking-wide text-center">
            {collection.topTitle}
          </h2>

          <Link
            to={collection.link}
            className="w-full relative aspect-square md:aspect-[4/5] overflow-hidden group block"
            aria-label={collection.topTitle}
          >
            <img 
              src={collection.image} 
              alt={collection.topTitle} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
          </Link>

          <p className="font-text-200 text-gray-700 text-[14px] tracking-wide text-center mt-2 max-w-[90%] mx-auto">
            {collection.bottomText}
          </p>
        </article>
      ))}
    </section>
  );
};
