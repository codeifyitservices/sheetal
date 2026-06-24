"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { API_BASE_URL } from "../services/api";

interface SliderImage {
  url: string;
  alt?: string;
  categoryLink?: string;
}

interface CenterContent {
  label?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  categoryLink?: string;
  categoryLinks?: string[];
}

const DEFAULT_CENTER: CenterContent = {
  label: "Exclusive Deal - Few Days Left",
  heading: "Timeless Women's Collection",
  description:
    "<p>Beautifully crafted pieces blending comfort, elegance, and effortless everyday style.</p>",
  buttonText: "View More",
  buttonLink: "#",
  categoryLink: "",
  categoryLinks: [],
};

const defaultImages: SliderImage[] = [
  { url: "/assets/deals1.jpg" },
  { url: "/assets/deals2.jpg" },
  { url: "/assets/deals3.jpg" },
];

const TimelessWomenCollection = () => {
  const [leftSliderImages, setLeftSliderImages] = useState<SliderImage[]>([]);
  const [rightSliderImages, setRightSliderImages] = useState<SliderImage[]>([]);
  const [centerContent, setCenterContent] =
    useState<CenterContent>(DEFAULT_CENTER);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchLookbook = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookbooks/timeless-women`);
        const data = await res.json();
        if (data.success && data.lookbook) {
          const lb = data.lookbook;
          const fallbackImages: SliderImage[] = lb.sliderImages || [];
          setLeftSliderImages(
            lb.leftSliderImages?.length > 0
              ? lb.leftSliderImages
              : fallbackImages,
          );
          setRightSliderImages(
            lb.rightSliderImages?.length > 0
              ? lb.rightSliderImages
              : fallbackImages,
          );
          if (lb.centerContent) {
            setCenterContent({ ...DEFAULT_CENTER, ...lb.centerContent });
          }
        }
      } catch {
        // Keep fallback content.
      }
    };
    fetchLookbook();
  }, []);

  const leftSliderData =
    leftSliderImages.length > 0 ? leftSliderImages : defaultImages;
  const rightSliderData =
    rightSliderImages.length > 0 ? rightSliderImages : defaultImages;
  const maxSlideCount = Math.max(leftSliderData.length, rightSliderData.length);
  const buttonHref =
    getLookbookHref(
      centerContent.categoryLink,
      centerContent.buttonLink,
      centerContent.categoryLinks,
    ) || "#";

  useEffect(() => {
    if (maxSlideCount <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % maxSlideCount);
    }, 3000);
    return () => window.clearInterval(id);
  }, [maxSlideCount]);

  return (
    <div className="flex w-full justify-center bg-[#fbfbfb] px-4 py-6 sm:px-6">
      <div className="container px-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch justify-items-center">
          <SliderTrack slides={leftSliderData} activeIndex={activeIndex} />

          <div className="w-full max-w-[800px] h-[320px] flex relative">
            <div className="hidden md:block absolute top-20 -left-5 h-0.5 w-15 z-99 bg-[#a2690f]" />
            <div className="hidden md:block absolute top-20 -right-5 h-0.5 w-15 z-99 bg-[#a2690f]" />
            <div className="flex w-full h-full border border-[#FFC107] rounded-2xl items-center justify-center hover:shadow-xl transition-shadow duration-300">
              <div className="px-5 text-center md:px-8">
                {centerContent.label && (
                  <p className="text-[14px] font-[family-name:var(--font-montserrat)] mb-4 text-black">
                    {centerContent.label}
                  </p>
                )}
                {centerContent.heading && (
                  <h2 className="text-[26px] lg:text-[30px] font-optima mb-4 text-[#6a3f07] leading-snug">
                    {centerContent.heading}
                  </h2>
                )}
                {centerContent.description && (
                  <div
                    className="text-[15px] text-black font-[family-name:var(--font-montserrat)] mb-4 max-w-xs mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: centerContent.description,
                    }}
                  />
                )}
                {centerContent.buttonText && (
                  <Link
                    href={buttonHref}
                    className="inline-block text-[16px] uppercase tracking-[0.2em] text-gray-800 border-y py-2 px-6 rounded border-gray-800 hover:text-[#cc8a00] hover:border-[#cc8a00] transition-colors"
                  >
                    {centerContent.buttonText}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <SliderTrack slides={rightSliderData} activeIndex={activeIndex} />
        </div>
      </div>
    </div>
  );
};

interface SliderTrackProps {
  slides: SliderImage[];
  activeIndex: number;
}

function SliderTrack({ slides, activeIndex }: SliderTrackProps) {
  const normalizedActiveIndex = slides.length ? activeIndex % slides.length : 0;

  return (
    <div className="w-full max-w-[800px] h-auto">
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex flex-row flex-nowrap transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(-${normalizedActiveIndex * 100}%, 0, 0)`,
          }}
        >
          {slides.map((img, i) => {
            const isActive = i === normalizedActiveIndex;
            const href = getLookbookHref(img.categoryLink);
            const imgEl = (
              <div className="relative w-full h-[310px]">
                <Image
                  src={img.url}
                  alt={img.alt || `Slide ${i + 1}`}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            );

            return (
              <div
                key={i}
                className="min-w-full w-full flex-shrink-0"
                style={{ pointerEvents: isActive ? "auto" : "none" }}
              >
                {href ? (
                  <Link href={href} className="block cursor-pointer">
                    {imgEl}
                  </Link>
                ) : (
                  imgEl
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getLookbookHref(
  categoryLink?: string,
  fallbackLink?: string,
  categoryLinks?: string[],
) {
  const selectedCategories =
    categoryLinks?.filter((slug) => Boolean(slug?.trim())) || [];

  if (selectedCategories.length > 0) {
    const params = new URLSearchParams({
      fromLookbook: "true",
      categories: selectedCategories.join(","),
    });
    return `/product-list?${params.toString()}`;
  }

  if (fallbackLink?.startsWith("/product-list")) {
    return fallbackLink;
  }

  if (categoryLink) {
    return `/${categoryLink}?fromLookbook=true`;
  }

  return fallbackLink || null;
}

export default TimelessWomenCollection;
