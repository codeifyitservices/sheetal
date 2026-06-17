"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCategories } from "../hooks/useCategories";
import { getCategoryImageUrl } from "../services/categoryService";

import { HiddenBeautyContent } from "../services/homepageService";

const HiddenBeauty = ({ content }: { content?: HiddenBeautyContent }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: false,
  });

  const {
    categories: propCategories = [],
    heading = "Bring Out The Hidden Beauty",
    subheading = "Designer pieces that blend traditional charm with modern silhouettes for every occasion.",
  } = content || {};

  const {
    categories: allCategories,
    loading: categoriesLoading,
    error,
  } = useCategories();

  // Use prop categories if available, otherwise fallback to all categories
  const categories =
    propCategories && propCategories.length > 0
      ? propCategories
      : allCategories;
  const loading = propCategories && propCategories.length > 0 ? false : categoriesLoading;

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex gap-8 items-center justify-center">
        <div className="hidden md:block h-[1px] bg-[#a2690f] w-15" />
        <h2 className="font-light text-[#6a3f07]">{heading}</h2>
        <div className="hidden md:block h-[1px] bg-[#a2690f] w-15" />
      </div>
    );
  }

  // Show error or empty state
  if (error || !categories || categories.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 text-center font-[family-name:var(--font-optima)]">
        <div className="flex gap-8 items-center justify-center">
          <div className="hidden md:block h-[1px] bg-[#a2690f] w-15" />
          <h2 className="font-light text-[#6a3f07]">{heading}</h2>
          <div className="hidden md:block h-[1px] bg-[#a2690f] w-15" />
        </div>
        <p className=" mx-auto text-[12px] lg:text-[15px] mb-8 text-[#a2690f]">
          {subheading}
        </p>
        <div className="flex flex-col justify-center items-center h-[400px] text-center">
          <div className="w-20 h-20 bg-[#f9f9f9] rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#5d4112"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-[#5d4112] mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-500 max-w-md">
            The site might be under construction or check your network access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-10 sm:px-6 md:pb-12 lg:px-12 text-center font-[family-name:var(--font-optima)]">
      <div className="flex gap-8 items-center justify-center">
        <div className="hidden md:block h-[2px] bg-[#a2690f] w-15" />
        <h2 className="font-optima font-light text-[#6a3f07]">{heading}</h2>
        <div className="hidden md:block h-[2px] bg-[#a2690f] w-15" />
      </div>
      <p className="mx-auto mb-10 max-w-3xl text-[12px] text-black font-[family-name:var(--font-montserrat)] lg:mb-16 lg:text-[15px]">
        {subheading}
      </p>

      {/* Embla Wrapper */}
      <div className="relative group/slider">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4 px-2 sm:gap-6 sm:px-4 md:gap-8 md:px-8">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="
    flex-shrink-0
    w-[72%]
    sm:w-[38%]
    lg:w-[20%]
  "
              >
                <div className="relative rounded-[16px] overflow-hidden group">
                  <Link href={`/${cat.slug}`} className="block">
                    <Image
                      src={getCategoryImageUrl(
                        cat,
                        "/assets/default-image.png",
                      )}
                      alt={cat.name}
                      width={400}
                      height={600}
                      className="w-full h-[320px] object-cover"
                      priority={false}
                    />
                  </Link>

                  <Link
                    href={`/${cat.slug}`}
                    className="
        absolute bottom-0 left-0 w-full
        text-center text-white text-[18px]
        bg-gradient-to-t from-[#251d05] to-transparent
        pt-[80px] pb-[20px]
        transition-all duration-300"
                  >
                    <span className="inline-block group-hover:text-[#ffc107] group-hover:-translate-y-3 transition-transform font-[family-name:var(--font-montserrat)] duration-300 text-[25px]">
                      {cat.name}
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav Buttons */}
        <button
              onClick={scrollPrev}
              aria-label="Previous Category"
              className="absolute left-[-50px] cursor-pointer bottom-[20%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
            >
              <Image src="/assets/left-image.png" alt="Previous" width={48} height={48} className="w-full h-auto" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next Category"
              className="absolute right-[-50px] cursor-pointer bottom-[20%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
            >
              <Image src="/assets/right-image.png" alt="Next" width={48} height={48} className="w-full h-auto" />
            </button>
      </div>
    </div>
  );
};

export default HiddenBeauty;
