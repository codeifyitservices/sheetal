"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { getApiImageUrl } from "../services/api";

export type BannerItem = {
  _id: string;
  title: string;
  link?: string;
  image?: {
    desktop?: { url?: string };
    mobile?: { url?: string };
  };
};

type BannerWithDesktopImage = BannerItem & {
  image: {
    desktop: { url?: string };
    mobile?: { url?: string };
  };
};

type BannerWithMobileImage = BannerItem & {
  image: {
    desktop?: { url?: string };
    mobile: { url?: string };
  };
};

const hasDesktopImage = (banner: BannerItem): banner is BannerWithDesktopImage =>
  Boolean(banner.image?.desktop);

const hasMobileImage = (banner: BannerItem): banner is BannerWithMobileImage =>
  Boolean(banner.image?.mobile);

const resolveBannerHref = (href?: string) => {
  const trimmedHref = href?.trim();
  if (!trimmedHref) return "#";

  const legacyCategoryMatch = trimmedHref.match(
    /^\/product-list\?category=([^&#]+)$/i,
  );
  if (!legacyCategoryMatch) {
    return trimmedHref;
  }

  const categorySlug = decodeURIComponent(legacyCategoryMatch[1] || "").trim();
  return categorySlug ? `/${encodeURIComponent(categorySlug)}` : "/product-list";
};

const ArrowIcon = ({ src, alt }: { src: string; alt: string }) => (
  <Image src={src} alt={alt} width={48} height={48} className="h-12 w-12" />
);

const fallbackDesktop = [
  {
    _id: "fallback-desktop",
    title: "Studio By Sheetal",
    link: "/",
    image: { desktop: { url: "/assets/default-image.png" } },
  },
];

const fallbackMobile = [
  {
    _id: "fallback-mobile",
    title: "Studio By Sheetal",
    link: "/",
    image: { mobile: { url: "/assets/default-image.png" } },
  },
];

const AUTO_ROTATE_MS = 5000;
const TRANSITION_MS = 700;

const dedupeById = <T extends { _id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?._id || seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
};

const HomeBannerCarousel = ({ banners }: { banners: BannerItem[] }) => {
  const desktopBanners = dedupeById(banners.filter(hasDesktopImage));
  const mobileBanners = dedupeById(banners.filter(hasMobileImage));
  const resolvedDesktopBanners =
    desktopBanners.length > 0 ? desktopBanners : fallbackDesktop;
  const resolvedMobileBanners =
    mobileBanners.length > 0 ? mobileBanners : fallbackMobile;
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [desktopTransitionEnabled, setDesktopTransitionEnabled] = useState(true);
  const [mobileTransitionEnabled, setMobileTransitionEnabled] = useState(true);
  const desktopLoopBanners =
    resolvedDesktopBanners.length > 1
      ? [...resolvedDesktopBanners, resolvedDesktopBanners[0]]
      : resolvedDesktopBanners;
  const mobileLoopBanners =
    resolvedMobileBanners.length > 1
      ? [...resolvedMobileBanners, resolvedMobileBanners[0]]
      : resolvedMobileBanners;

  useEffect(() => {
    if (resolvedDesktopBanners.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setDesktopTransitionEnabled(true);
      setDesktopIndex((current) => current + 1);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [resolvedDesktopBanners.length]);

  useEffect(() => {
    if (resolvedMobileBanners.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setMobileTransitionEnabled(true);
      setMobileIndex((current) => current + 1);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [resolvedMobileBanners.length]);

  useEffect(() => {
    if (resolvedDesktopBanners.length <= 1) return;
    if (desktopIndex !== resolvedDesktopBanners.length) return;

    const timeoutId = window.setTimeout(() => {
      setDesktopTransitionEnabled(false);
      setDesktopIndex(0);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [desktopIndex, resolvedDesktopBanners.length]);

  useEffect(() => {
    if (resolvedMobileBanners.length <= 1) return;
    if (mobileIndex !== resolvedMobileBanners.length) return;

    const timeoutId = window.setTimeout(() => {
      setMobileTransitionEnabled(false);
      setMobileIndex(0);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [mobileIndex, resolvedMobileBanners.length]);

  useEffect(() => {
    if (!desktopTransitionEnabled) {
      const frameId = window.requestAnimationFrame(() => {
        setDesktopTransitionEnabled(true);
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [desktopTransitionEnabled]);

  useEffect(() => {
    if (!mobileTransitionEnabled) {
      const frameId = window.requestAnimationFrame(() => {
        setMobileTransitionEnabled(true);
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [mobileTransitionEnabled]);

  return (
    <div className="relative w-full p-0 home-banner">
      <div className="relative hidden md:block">
        <div className="relative overflow-hidden">
          <div
            className={`flex ease-out ${desktopTransitionEnabled ? "transition-transform duration-700" : ""}`}
            style={{ transform: `translate3d(-${desktopIndex * 100}%, 0, 0)` }}
          >
            {desktopLoopBanners.map((banner, index) => (
              <div key={`${banner._id}-desktop-${index}`} className="banner-carousel-item min-w-full outline-none">
                <Link href={resolveBannerHref(banner.link)}>
                  <div className="relative aspect-[8/3] min-h-[640px] w-full bg-[#e9e0d1]">
                    <Image
                      src={getApiImageUrl(
                        banner.image.desktop,
                        "/assets/default-image.png",
                      )}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : undefined}
                      quality={78}
                      sizes="100vw"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {resolvedDesktopBanners.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                className="absolute left-[50px] top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer md:flex"
                onClick={() => {
                  setDesktopTransitionEnabled(true);
                  setDesktopIndex((current) =>
                    current === 0 ? resolvedDesktopBanners.length - 1 : current - 1,
                  );
                }}
              >
                <ArrowIcon src="/assets/left-image.png" alt="Previous banner" />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                className="absolute right-[50px] top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer md:flex"
                onClick={() => {
                  setDesktopTransitionEnabled(true);
                  setDesktopIndex((current) =>
                    current === resolvedDesktopBanners.length ? current : current + 1,
                  );
                }}
              >
                <ArrowIcon src="/assets/right-image.png" alt="Next banner" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative block md:hidden">
        <div className="relative overflow-hidden">
          <div
            className={`flex ease-out ${mobileTransitionEnabled ? "transition-transform duration-700" : ""}`}
            style={{ transform: `translate3d(-${mobileIndex * 100}%, 0, 0)` }}
          >
            {mobileLoopBanners.map((banner, index) => (
              <div key={`${banner._id}-mobile-${index}`} className="banner-carousel-item min-w-full outline-none">
                <Link href={resolveBannerHref(banner.link)}>
                  <div className="relative min-h-[100svh] w-full bg-[#e9e0d1]">
                    <Image
                      src={getApiImageUrl(
                        banner.image.mobile,
                        "/assets/default-image.png",
                      )}
                      alt={banner.title}
                      fill
                      className="object-cover object-top"
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : undefined}
                      quality={75}
                      sizes="100vw"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24">
          <Link href="/" className="pointer-events-auto">
            <Image
              src="/assets/625030871.png"
              alt="Studio By Sheetal"
              width={300}
              height={150}
              className="h-[150px] w-auto"
              priority
              quality={75}
            />
          </Link>
        </div>
      </div>

      <Image
        src="/assets/shape-bt.png"
        alt=""
        width={1920}
        height={160}
        className="absolute bottom-0 left-0 z-20 h-auto w-full"
        sizes="100vw"
        quality={72}
      />
    </div>
  );
};

export default HomeBannerCarousel;
