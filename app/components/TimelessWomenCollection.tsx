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
}

const DEFAULT_CENTER: CenterContent = {
  label: "Exclusive Deal • Few Days Left",
  heading: "Timeless Women's Collection",
  description:
    "<p>Beautifully crafted pieces blending comfort, elegance, and effortless everyday style.</p>",
  buttonText: "View More",
  buttonLink: "#",
  categoryLink: "",
};

const TimelessWomenCollection = () => {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [centerContent, setCenterContent] = useState<CenterContent>(DEFAULT_CENTER);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchLookbook = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookbooks/timeless-women`);
        const data = await res.json();
        if (data.success && data.lookbook) {
          const lb = data.lookbook;
          const imgs: SliderImage[] =
            lb.sliderImages?.length > 0
              ? lb.sliderImages
              : lb.leftSliderImages || [];
          setSliderImages(imgs);
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

  const defaultImages: SliderImage[] = [
    { url: "/assets/deals1.jpg" },
    { url: "/assets/deals2.jpg" },
    { url: "/assets/deals3.jpg" },
  ];

  const sliderData: SliderImage[] =
    sliderImages.length > 0 ? sliderImages : defaultImages;

  // Single shared auto-advance — both sliders stay in sync
  useEffect(() => {
    if (sliderData.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((c) => (c + 1) % sliderData.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [sliderData.length]);

  const currentImage = sliderData[activeIndex];

  // Center banner href: active image's category → center's category → buttonLink
  // Append ?fromLookbook=true so the category page filters to discounted products.
  const bannerHref =
    currentImage?.categoryLink
      ? `/${currentImage.categoryLink}?fromLookbook=true`
      : centerContent.categoryLink
      ? `/${centerContent.categoryLink}?fromLookbook=true`
      : centerContent.buttonLink || "#";

  return (
    <div className="flex w-full justify-center bg-[#fbfbfb] px-4 py-6 sm:px-6">
      <div className="container px-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch justify-items-center">

          {/* ── Left Slider ─────────────────────────────────────────────── */}
          <SliderTrack
            slides={sliderData}
            activeIndex={activeIndex}
            centerContent={centerContent}
          />

          {/* ── Center Banner ────────────────────────────────────────────── */}
          <div className="w-full max-w-[400px] h-[320px] flex relative">
            <div className="hidden md:block absolute top-20 -left-5 h-0.5 w-15 bg-[#a2690f]" />
            <div className="hidden md:block absolute top-20 -right-5 h-0.5 w-15 bg-[#a2690f]" />
            <Link
              href={bannerHref}
              className="flex w-full h-full border border-[#FFC107] rounded-2xl items-center justify-center hover:shadow-xl transition-shadow duration-300"
            >
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
                    dangerouslySetInnerHTML={{ __html: centerContent.description }}
                  />
                )}
                {centerContent.buttonText && (
                  <span className="inline-block text-[16px] uppercase tracking-[0.2em] text-gray-800 border-y py-2 px-6 rounded border-gray-800 hover:text-[#cc8a00] hover:border-[#cc8a00] transition-colors">
                    {centerContent.buttonText}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* ── Right Slider ─────────────────────────────────────────────── */}
          <SliderTrack
            slides={sliderData}
            activeIndex={activeIndex}
            centerContent={centerContent}
          />

        </div>
      </div>
    </div>
  );
};

// ─── Reusable slider track ────────────────────────────────────────────────────
// Uses translate3d for the slide animation AND pointer-events:none on off-screen
// slides so they never intercept clicks even though overflow:hidden doesn't
// clip pointer events in browsers.

interface SliderTrackProps {
  slides: SliderImage[];
  activeIndex: number;
  centerContent: CenterContent;
}

function SliderTrack({ slides, activeIndex, centerContent }: SliderTrackProps) {
  return (
    <div className="w-full max-w-[400px] h-auto">
      {/* overflow-hidden clips the visual strip */}
      <div className="overflow-hidden rounded-lg">
        {/* The sliding strip — moves left by activeIndex * 100% */}
        <div
          className="flex flex-row flex-nowrap transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {slides.map((img, i) => {
            const isActive = i === activeIndex;

            // Image href: image's own category → center category → buttonLink → nothing
            // Append ?fromLookbook=true so the category page filters to discounted products.
            const href = img.categoryLink
              ? `/${img.categoryLink}?fromLookbook=true`
              : centerContent.categoryLink
              ? `/${centerContent.categoryLink}?fromLookbook=true`
              : centerContent.buttonLink || null;

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
              // Each slide takes exactly 100% of the container width and never shrinks
              <div
                key={i}
                className="min-w-full w-full flex-shrink-0"
                // ← KEY FIX: only the visible slide can receive pointer events.
                // overflow:hidden clips visuals but NOT pointer events in browsers,
                // so off-screen slides would eat clicks without this.
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

export default TimelessWomenCollection;
