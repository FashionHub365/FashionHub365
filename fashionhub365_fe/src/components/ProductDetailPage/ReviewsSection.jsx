import React, { useEffect, useState } from "react";
import { CheckCircle, Star1, Star } from "../Icons";
import listingApi from "../../apis/listingApi";

export const ReviewsSection = ({ productId, product }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    average: 0,
    count: 0,
    breakdowns: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
  });
  const [loading, setLoading] = useState(true);

  // Trích xuất các Size có sẵn của sản phẩm
  const availableSizes = React.useMemo(() => {
    if (!product || !product.variants) return [];
    return [...new Set(product.variants.map(v => v.attributes?.size).filter(Boolean))];
  }, [product]);

  // States cho modal Đánh giá
  const [showModal, setShowModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "", name: "", size: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // States cho Filter and Sort
  const [filterRating, setFilterRating] = useState("All");
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  const filteredAndSortedReviews = React.useMemo(() => {
    let result = [...reviews];

    // Lọc theo số sao
    if (filterRating !== "All") {
      result = result.filter(r => r.rating === parseInt(filterRating));
    }

    // Lọc theo verified
    if (filterVerified) {
      result = result.filter(r => r.verified_purchase);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;

      // latest
      return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
    });

    return result;
  }, [reviews, filterRating, filterVerified, sortBy]);

  const fetchReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listingApi.getProductReviews(productId);
      if (res.success) {
        setReviews(res.data.reviews || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch product reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetchReviews();
  }, [productId, fetchReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await listingApi.createProductReview(productId, {
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
        reviewer_info: {
          name: reviewForm.name || "Anonymous",
          size_purchased: reviewForm.size || undefined
        }
      });
      setSubmitMessage({ type: "success", text: "Đánh giá của bạn đã được gửi thành công!" });
      setTimeout(() => {
        setShowModal(false);
        setSubmitMessage(null);
        setReviewForm({ rating: 5, title: "", content: "", name: "", size: "" }); // reset
        fetchReviews(); // reload reviews
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi gửi đánh giá";
      if (err.response?.status === 401) {
        setSubmitMessage({ type: "error", text: "Bạn cần đăng nhập để viết đánh giá." });
      } else {
        setSubmitMessage({ type: "error", text: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-col items-center justify-center gap-10 px-[196px] py-20 flex relative self-stretch w-full">
        <span className="font-text-200 text-x-500 animate-pulse">Đang tải đánh giá...</span>
      </section>
    );
  }

  // Define total reviews to calculate progress bar widths
  const maxCount = Math.max(...summary.breakdowns.map(b => b.count), 1);

  return (
    <section className="flex-col items-start gap-10 px-[196px] py-0 flex relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-100-demi font-[number:var(--display-100-demi-font-weight)] text-x-500 text-[length:var(--display-100-demi-font-size)] text-center tracking-[var(--display-100-demi-letter-spacing)] leading-[var(--display-100-demi-line-height)] [font-style:var(--display-100-demi-font-style)]">
        Reviews
      </h2>

      <div className="flex items-start gap-[55px] pt-9 pb-[84px] px-14 relative self-stretch w-full flex-[0_0_auto] bg-x-100">
        <div className="flex flex-col items-start gap-[15px] relative flex-1 grow">
          <div className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
            {summary.average.toFixed(1)} Overall Rating
          </div>

          <div
            className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]"
            role="img"
            aria-label={`${summary.average} out of 5 stars`}
          >
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`!relative !w-[22px] !h-[22px] ${index < Math.round(summary.average) ? "text-x-600" : "text-x-200"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 relative flex-1 grow">
          {summary.breakdowns.map((breakdown) => (
            <div
              key={breakdown.stars}
              className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]"
            >
              <div className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {breakdown.stars}
              </div>

              <Star1 className="!relative !w-[18px] !h-[18px]" />

              {/* Progress bar bối cảnh thực tế */}
              <div className="relative flex-1 grow h-1.5 bg-x-200 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-x-500 transition-all duration-500"
                  style={{ width: `${(breakdown.count / maxCount) * 100}%` }}
                />
              </div>

              <div className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {breakdown.count}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start relative flex-1 grow">
          <div className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
            True to size
          </div>

          <div className="flex items-center gap-1 pt-4 pb-2 px-0 relative self-stretch w-full flex-[0_0_auto]">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`relative flex-1 grow h-2 ${index === 2 ? "bg-x-500" : "bg-x-200"}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
              Run small
            </div>

            <div className="text-right relative w-fit mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
              Run large
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Toolbar Sort & Filter Gọn gàng mượt mà */}
      <div className="flex flex-col gap-4 w-full mb-8 pt-4 pb-4 border-t border-b border-gray-200">
        <div className="flex items-center justify-between w-full flex-wrap gap-4">

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="font-text-400-demi text-sm text-gray-700 whitespace-nowrap hidden md:inline mr-2">Filter:</span>

            {["All", "5", "4", "3", "2", "1"].map((val) => (
              <button
                key={val}
                onClick={() => setFilterRating(val)}
                className={`py-1.5 px-4 text-sm font-text-200 border rounded-full transition-all whitespace-nowrap
                  ${filterRating === val ? "bg-x-600 border-x-600 text-white shadow-sm" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50"}`}
              >
                {val === "All" ? "All Star" : `${val} Star`}
              </button>
            ))}

            <button
              onClick={() => setFilterVerified(!filterVerified)}
              className={`py-1.5 px-4 text-sm font-text-200 border rounded-full transition-all whitespace-nowrap flex items-center gap-1 ml-2
                ${filterVerified ? "bg-gray-900 border-gray-900 text-white shadow-sm" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50"}`}
            >
              <CheckCircle className={`!w-4 !h-4 ${filterVerified ? "text-white" : "text-gray-400"}`} /> Verified
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-text-400-demi text-sm text-gray-700 whitespace-nowrap hidden md:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-4 text-sm font-text-200 border border-gray-300 rounded-full bg-white focus:outline-none focus:border-x-600 transition-colors cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

            {/* Write Review Button */}
            <button
              onClick={() => setShowModal(true)}
              className="bg-black text-white font-text-200-demi px-5 py-2 text-sm rounded hover:bg-gray-800 hover:shadow-md transition-all whitespace-nowrap"
            >
              Write Review
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-px relative self-stretch w-full flex-[0_0_auto]">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="py-10 flex w-full justify-center">
            <span className="font-text-200 text-x-400">Không tìm thấy đánh giá nào phù hợp với bộ lọc.</span>
          </div>
        ) : (
          filteredAndSortedReviews.map((review, reviewIndex) => (
            <article
              key={review._id || reviewIndex}
              className={`flex items-start gap-2.5 pt-${reviewIndex === 0 ? "0" : "10"} pb-[57px] px-0 relative self-stretch w-full flex-[0_0_auto] ${reviewIndex === 0 ? "mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200" : ""}`}
            >
              <div className="flex flex-col w-[230px] items-start relative">
                <h3 className="relative text-left self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
                  {review.reviewer_info?.name || "Anonymous"}
                </h3>

                {review.verified_purchase && (
                  <div className="flex items-center gap-1 pt-2 pb-5 px-0 relative self-stretch w-full flex-[0_0_auto]">
                    <CheckCircle className="!relative !w-[18px] !h-[18px]" />
                    <span className="relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                      Verified
                    </span>
                  </div>
                )}

                {review.reviewer_info?.size_purchased && (
                  <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
                    <span className="relative w-fit mt-[-1.00px] font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-500 text-[length:var(--text-200-demi-font-size)] tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                      Size:
                    </span>
                    <span className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                      {review.reviewer_info.size_purchased}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start gap-3 relative flex-1 grow">
                <div
                  className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto] text-amber-400"
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`!relative !w-5 !h-5 ${index < review.rating ? "text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>

                <h4 className="relative self-stretch font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
                  {review.title}
                </h4>

                <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
                  {review.content}
                </p>

                {review.seller_response && (
                  <div className="mt-6 ml-[-200px] p-5 bg-gray-50 border-l-4 border-gray-900 self-stretch rounded-r-lg">
                    <p className="text-[11px] font-text-400-demi text-gray-500 mb-2 uppercase tracking-[0.1em]">
                      Response from shop
                    </p>
                    <p className="text-[14px] font-text-300 text-gray-900 leading-relaxed italic">
                      "{review.seller_response}"
                    </p>
                  </div>
                )}
              </div>

              <time className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {review.daysAgo === 0 ? "Today" : `${review.daysAgo} days ago`}
              </time>
            </article>
          ))
        )}
      </div>

      {/* Modal Đánh giá */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-8 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-display-100-demi text-x-600 mb-6">Write a Review</h2>

            {submitMessage && (
              <div className={`p-4 mb-4 text-sm font-text-200 ${submitMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {submitMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-text-200 mb-2">Rating</label>
                <div className="flex items-center gap-2 cursor-pointer">
                  {[1, 2, 3, 4, 5].map(star => (
                    <div key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                      <Star className={`!w-8 !h-8 ${star <= reviewForm.rating ? "text-amber-400" : "text-gray-300"} hover:scale-110 transition-transform`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-text-200 mb-2">Your Name (optional)</label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-3 border border-gray-300 font-text-200 focus:outline-none focus:border-x-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-text-200 mb-2">Size (optional)</label>
                  {availableSizes.length > 0 ? (
                    <select
                      value={reviewForm.size}
                      onChange={(e) => setReviewForm({ ...reviewForm, size: e.target.value })}
                      className="w-full p-3 border border-gray-300 font-text-200 focus:outline-none focus:border-x-600 bg-white"
                    >
                      <option value="">-- Select --</option>
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={reviewForm.size}
                      onChange={(e) => setReviewForm({ ...reviewForm, size: e.target.value })}
                      placeholder="e.g. M, 39, 42..."
                      className="w-full p-3 border border-gray-300 font-text-200 focus:outline-none focus:border-x-600"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-text-200 mb-2">Review Title</label>
                <input
                  type="text"
                  required
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Summarize your thoughts"
                  className="w-full p-3 border border-gray-300 font-text-200 focus:outline-none focus:border-x-600"
                />
              </div>

              <div>
                <label className="block text-sm font-text-200 mb-2">Review Detail</label>
                <textarea
                  required
                  rows="4"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Tell us what you liked or disliked..."
                  className="w-full p-3 border border-gray-300 font-text-200 focus:outline-none focus:border-x-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 bg-x-600 text-white font-text-200-demi py-3 hover:bg-black transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
