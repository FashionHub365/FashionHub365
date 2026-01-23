import React from "react";
import { CaretDown, CheckCircle, List, Star1, Star } from "../Icons";
import { IconComponentNode } from "../IconComponentNode";

export const ReviewsSection = () => {
  const ratingBreakdowns = [
    { stars: 5, count: 2 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  const reviews = [
    {
      reviewer: {
        name: "ElizabethRBklyn",
        height: "5'9\" - 5'11\"",
        weight: "161 - 180 lb",
        bodyType: "Petite",
        sizePurchased: "L",
        usualSize: "L",
      },
      rating: 5,
      title: "Warm and very attractive on",
      content:
        "Got this to keep my husband warm on those chilly late fall days. He loves it as it not only is pretty warm but he looks good in it and he knows it.",
      daysAgo: 14,
      verified: true,
    },
    {
      reviewer: {
        name: "Anonymous",
        height: "5'9\" - 5'11\"",
        weight: "161 - 180 lb",
        bodyType: "Petite",
        sizePurchased: "L",
        usualSize: "L",
      },
      rating: 5,
      title: "Super comfy",
      content:
        "Great quality, warm and super comfy. Got the XL cuz I have a large back and it fits perfect. It does run a bit oversized which is good.",
      daysAgo: 14,
      verified: true,
    },
  ];

  return (
    <section className="flex-col items-start gap-10 px-[196px] py-0 flex relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] font-display-100-demi font-[number:var(--display-100-demi-font-weight)] text-x-500 text-[length:var(--display-100-demi-font-size)] text-center tracking-[var(--display-100-demi-letter-spacing)] leading-[var(--display-100-demi-line-height)] [font-style:var(--display-100-demi-font-style)]">
        Reviews
      </h2>

      <div className="flex items-start gap-[55px] pt-9 pb-[84px] px-14 relative self-stretch w-full flex-[0_0_auto] bg-x-100">
        <div className="flex flex-col items-start gap-[15px] relative flex-1 grow">
          <div className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
            5.0 Overall Rating
          </div>

          <div
            className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]"
            role="img"
            aria-label="5 out of 5 stars"
          >
            {[...Array(5)].map((_, index) => (
              <Star key={index} className="!relative !w-[22px] !h-[22px]" />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 relative flex-1 grow">
          {ratingBreakdowns.map((breakdown) => (
            <div
              key={breakdown.stars}
              className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]"
            >
              <div className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {breakdown.stars}
              </div>

              <Star1 className="!relative !w-[18px] !h-[18px]" />
              <div
                className={`relative flex-1 grow h-1.5 ${breakdown.count > 0 ? "bg-x-500" : "bg-x-200"}`}
                role="progressbar"
                aria-valuenow={breakdown.count}
                aria-valuemin={0}
                aria-valuemax={2}
              />

              <div className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
                {breakdown.count}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start relative flex-1 grow">
          <div className="relative self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-500 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
            Runs slightly large
          </div>

          <div className="flex items-center gap-1 pt-4 pb-2 px-0 relative self-stretch w-full flex-[0_0_auto]">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`relative flex-1 grow h-2 ${index === 3 ? "bg-x-500" : "bg-x-200"}`}
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

      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <button className="flex w-[242px] items-center gap-2.5 p-4 relative ml-[-1.00px] border border-solid border-x-200 bg-transparent cursor-pointer">
          <span className="relative flex-1 font-display-100-demi font-[number:var(--display-100-demi-font-weight)] text-x-600 text-[length:var(--display-100-demi-font-size)] tracking-[var(--display-100-demi-letter-spacing)] leading-[var(--display-100-demi-line-height)] [font-style:var(--display-100-demi-font-style)]">
            Filter
          </span>

          <List className="!relative !w-6 !h-6" />
        </button>

        <button className="flex w-[242px] items-center gap-2.5 p-4 relative mt-[-1.00px] mb-[-1.00px] mr-[-1.00px] border border-solid border-x-200 bg-transparent cursor-pointer">
          <div className="flex flex-col items-start justify-center relative flex-1 grow">
            <span className="relative self-stretch mt-[-1.00px] font-display-100-demi font-[number:var(--display-100-demi-font-weight)] text-x-600 text-[length:var(--display-100-demi-font-size)] tracking-[var(--display-100-demi-letter-spacing)] leading-[var(--display-100-demi-line-height)] [font-style:var(--display-100-demi-font-style)]">
              Sort by:
            </span>

            <span className="relative self-stretch font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
              Highest to Lowest Rating
            </span>
          </div>

          <CaretDown className="!relative !w-6 !h-6" />
        </button>
      </div>

      <div className="flex flex-col items-start gap-px relative self-stretch w-full flex-[0_0_auto]">
        {reviews.map((review, reviewIndex) => (
          <article
            key={reviewIndex}
            className={`flex items-start gap-2.5 pt-${reviewIndex === 0 ? "0" : "10"} pb-[57px] px-0 relative self-stretch w-full flex-[0_0_auto] ${reviewIndex === 0 ? "mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-x-200" : ""}`}
          >
            <div className="flex flex-col w-[230px] items-start relative">
              <h3 className="relative text-left self-stretch mt-[-1.00px] font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
                {review.reviewer.name}
              </h3>

              {review.verified && (
                <div className="flex items-center gap-1 pt-2 pb-5 px-0 relative self-stretch w-full flex-[0_0_auto]">
                  <CheckCircle className="!relative !w-[18px] !h-[18px]" />
                  <span className="relative flex-1 font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                    Verified
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
                <span className="relative w-fit mt-[-1.00px] font-text-200-demi font-[number:var(--text-200-demi-font-weight)] text-x-500 text-[length:var(--text-200-demi-font-size)] tracking-[var(--text-200-demi-letter-spacing)] leading-[var(--text-200-demi-line-height)] whitespace-nowrap [font-style:var(--text-200-demi-font-style)]">
                  Height:
                </span>

                <span className="relative flex-1 mt-[-1.00px] font-text-200 font-[number:var(--text-200-font-weight)] text-x-500 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] [font-style:var(--text-200-font-style)]">
                  {review.reviewer.height}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 relative flex-1 grow">
              <div
                className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]"
                role="img"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="!relative !w-5 !h-5"
                  />
                ))}
              </div>

              <h4 className="relative self-stretch font-text-400-demi font-[number:var(--text-400-demi-font-weight)] text-x-600 text-[length:var(--text-400-demi-font-size)] tracking-[var(--text-400-demi-letter-spacing)] leading-[var(--text-400-demi-line-height)] [font-style:var(--text-400-demi-font-style)]">
                {review.title}
              </h4>

              <p className="relative self-stretch font-text-300 font-[number:var(--text-300-font-weight)] text-x-600 text-[length:var(--text-300-font-size)] tracking-[var(--text-300-letter-spacing)] leading-[var(--text-300-line-height)] [font-style:var(--text-300-font-style)]">
                {review.content}
              </p>
            </div>

            <time className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-x-300 text-[length:var(--text-200-font-size)] tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
              {review.daysAgo} days ago
            </time>
          </article>
        ))}
      </div>
    </section>
  );
};
