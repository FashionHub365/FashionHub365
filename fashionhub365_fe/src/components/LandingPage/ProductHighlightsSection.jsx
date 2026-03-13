import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CaretLeft, CaretRight } from "../Icons";
import listingApi from "../../apis/listingApi";
import Skeleton from "../common/Skeleton";

export const ProductHighlightsSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default products to show per slide
  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(products.length / itemsPerSlide);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // GET 10 products for the carousel
        const response = await listingApi.getProducts({ limit: 12 });
        if (response.success && response.data?.products) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error("Failed to load carousel products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : Math.max(0, totalSlides - 1)));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (totalSlides <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(intervalId);
  }, [totalSlides]);

  // Get current visible products
  const visibleProducts = products.slice(
    currentSlide * itemsPerSlide,
    currentSlide * itemsPerSlide + itemsPerSlide
  );

  return (
    <section
      className="flex-col items-start gap-[30px] pt-[90px] pb-[73px] px-0 flex relative self-stretch w-full flex-[0_0_auto]"
      aria-labelledby="product-highlights-heading"
    >
      <header className="flex flex-col items-center gap-3 px-[42px] py-0 relative self-stretch w-full flex-[0_0_auto]">
        <h2
          id="product-highlights-heading"
          className="relative self-stretch mt-[-1.00px] font-display-100 font-[number:var(--display-100-font-weight)] text-black text-[length:var(--display-100-font-size)] text-center tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]"
        >
          Everlane Favorites
        </h2>

        <p className="relative self-stretch font-text-400 font-[number:var(--text-400-font-weight)] text-black text-[length:var(--text-400-font-size)] text-center tracking-[var(--text-400-letter-spacing)] leading-[var(--text-400-line-height)] [font-style:var(--text-400-font-style)]">
          Beautifully Functional. Purposefully Designed. Consciously Crafted.
        </p>
      </header>

      <div className="flex items-center justify-center gap-3 relative self-stretch w-full flex-[0_0_auto] px-[20px] lg:px-[40px] max-w-[1400px] mx-auto min-h-[500px]">
        {products.length > itemsPerSlide && (
          <button
            onClick={handlePrevious}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2.5 bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Previous products"
            type="button"
          >
            <CaretLeft className="w-8 h-8 md:w-10 md:h-10 text-gray-800" />
          </button>
        )}

        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Skeleton className="w-full aspect-[3/4]" />
                <Skeleton className="w-full h-4 mt-2" />
                <Skeleton className="w-1/2 h-4" />
              </div>
            ))
          ) : visibleProducts.length > 0 ? (
            visibleProducts.map((product) => (
              <article
                key={product._id}
                className="flex flex-col items-center gap-3 relative group"
              >
                <Link to={`/product/${product.slug || product._id}`} className="w-full block relative overflow-hidden aspect-[3/4] bg-gray-100">
                  <img
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={product.name}
                    src={product.media?.[0]?.url || "/textures/productdetailpage/image.jpg"}
                  />
                  {product.isNewArrival && (
                    <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest leading-none z-10">
                      New
                    </span>
                  )}
                </Link>

                <div className="flex flex-col items-start gap-1 w-full mt-1">
                  <div className="flex justify-between items-start gap-3 w-full">
                    <Link to={`/product/${product.slug || product._id}`} className="hover:underline flex-1">
                      <h3 className="font-text-200 font-bold text-gray-900 text-[14px] md:text-[15px] leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <span className="text-gray-900 font-bold font-text-200 text-[14px] md:text-[15px] whitespace-nowrap">
                      {product.base_price?.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  {product.primary_category_id?.name && (
                    <p className="font-text-200 text-gray-500 text-[13px] line-clamp-1">
                      {product.primary_category_id.name}
                    </p>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 py-10">No products available.</p>
          )}
        </div>

        {products.length > itemsPerSlide && (
          <button
            onClick={handleNext}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2.5 bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Next products"
            type="button"
          >
            <CaretRight className="w-8 h-8 md:w-10 md:h-10 text-gray-800" />
          </button>
        )}
      </div>

      {totalSlides > 1 && (
        <nav
          className="flex items-center justify-center px-0 py-5 self-stretch w-full gap-3 relative flex-[0_0_auto]"
          aria-label="Product carousel pagination"
        >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`${
              currentSlide === index ? "bg-x-500" : "bg-x-200"
            } relative w-[7px] h-[7px] rounded-[3.5px] border-0 cursor-pointer p-0`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? "true" : "false"}
            type="button"
          />
        ))}
        </nav>
      )}
    </section>
  );
};
