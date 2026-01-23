import React from "react";

export const IntroTextSection = () => {
  return (
    <section 
      className="flex-col h-[691px] items-start justify-end gap-2.5 px-[53px] py-[70px] bg-cover bg-[50%_50%] flex relative self-stretch w-full"
      style={{ backgroundImage: "url(/textures/blogpost/section-01.jpg)" }}
    >
      <div className="flex flex-col w-[940px] items-start justify-end gap-2.5 relative flex-[0_0_auto]">
        <div className="inline-flex items-center justify-center gap-2.5 px-5 py-2 relative flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] rounded-[30px] border border-solid border-white">
          <div className="relative w-fit font-text-200 font-[number:var(--text-200-font-weight)] text-white text-[length:var(--text-200-font-size)] text-center tracking-[var(--text-200-letter-spacing)] leading-[var(--text-200-line-height)] whitespace-nowrap [font-style:var(--text-200-font-style)]">
            Style
          </div>
        </div>

        <div className="flex flex-col items-start justify-end gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
          <h1 className="relative self-stretch mt-[-1.00px] font-display-700-dmei font-[number:var(--display-700-dmei-font-weight)] text-white text-[length:var(--display-700-dmei-font-size)] tracking-[var(--display-700-dmei-letter-spacing)] leading-[var(--display-700-dmei-line-height)] [font-style:var(--display-700-dmei-font-style)]">
            Style
            <br />
            How To Style Winter <br />
            Whites
          </h1>

          <p className="relative self-stretch font-display-100 font-[number:var(--display-100-font-weight)] text-white text-[length:var(--display-100-font-size)] tracking-[var(--display-100-letter-spacing)] leading-[var(--display-100-line-height)] [font-style:var(--display-100-font-style)]">
            Redefine your winter wardrobe with the timeless elegance of winter
            whites with this style guide.
          </p>
        </div>
      </div>
    </section>
  );
};
