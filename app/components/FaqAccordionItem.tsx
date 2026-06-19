"use client";

import React, { useState, useRef, useEffect } from "react";

interface FaqAccordionItemProps {
  question: string;
  answer: string;
}

export const FaqAccordionItem: React.FC<FaqAccordionItemProps> = ({
  question,
  answer,
}) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0);
    }
  }, [open]);

  return (
    <div className="border-b border-[#c8bba8]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-[15px] text-left"
        aria-expanded={open}
      >
        {/* Question — dark near-black, matches desired */}
        <span className="font-[family-name:var(--font-optima)] text-[16px] font-semibold tracking-wide text-[#061210] leading-snug pr-6">
          {question}
        </span>

        {/* + icon — dark, rotates to × when open */}
        <span
          className="shrink-0 w-5 h-5 flex items-center justify-center text-[#1a1208] text-xl font-medium leading-none transition-transform duration-300 ease-in-out"
          
          aria-hidden="true"
        >
          {open ? "-" : "+"}
        </span>
      </button>

      {/* Smooth slide-down answer panel */}
      <div
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 300ms ease-in-out",
        }}
      >
        <div ref={contentRef} className="pb-6 pr-10">
          <div
            className="
              font-[family-name:var(--font-montserrat)]
              text-[15px]
              text-black
              leading-relaxed
              prose prose-sm max-w-none
              prose-p:my-1
              prose-ul:my-1 prose-ol:my-1
              prose-li:my-0.5
              prose-strong:text-[#1a1208]
              prose-a:text-[#7a4e1a] prose-a:underline
            "
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </div>
      </div>
    </div>
  );
};