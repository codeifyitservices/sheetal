"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isExternalHref } from "../services/homepageService";

export type TopInfoContent = {
  text: string;
  code: string | null;
  href: string;
  ctaLabel: string;
};

// Pixels per second. Lower = slower scroll.
const SCROLL_SPEED_PX_PER_SEC = 50;
const MIN_DURATION_SECONDS = 8;
const GAP_PX = 64;

const TopInfoLink = ({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) => {
  const linkClassName = `underline font-normal ${className}`.trim();

  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={linkClassName}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {label}
    </Link>
  );
};

const TopInfoMessage = ({ content }: { content: TopInfoContent }) => {
  const hasText = content.text.trim() !== "";

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[15px] text-black max-[552px]:text-[12px]">
      <span>
        {content.text}
        {content.code && (
          <>
            {" "}Use code{" "}
            <span className="font-bold tracking-widest">{content.code}</span>
            {":"}
          </>
        )}
        {!content.code && hasText && ":"}
      </span>
      <TopInfoLink
        href={content.href}
        label={content.ctaLabel}
        className="shrink-0"
      />
    </span>
  );
};

export default function TopInfoScroller({
  content,
}: {
  content: TopInfoContent;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [duration, setDuration] = useState(MIN_DURATION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const measure = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const contentWidth = measureRef.current?.scrollWidth || 0;

      if (!containerWidth || !contentWidth) return;

      const overflowing = contentWidth > containerWidth;
      setIsOverflowing(overflowing);

      if (overflowing) {
        setDuration(
          Math.max(contentWidth / SCROLL_SPEED_PX_PER_SEC, MIN_DURATION_SECONDS),
        );
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [content.text, content.code, content.href, content.ctaLabel]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden px-3 max-[552px]:px-2">
      {/* Hidden measuring copy: always rendered once, un-truncated, to get a true width */}
      <div
        ref={measureRef}
        className="invisible absolute -z-10 inline-flex"
        aria-hidden="true"
      >
        <TopInfoMessage content={content} />
      </div>

      {!isOverflowing ? (
        <div className="flex justify-center truncate">
          <TopInfoMessage content={content} />
        </div>
      ) : (
        <div
          className="flex w-max"
          style={{
            animation: `top-info-marquee ${duration}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex shrink-0 items-center" style={{ paddingRight: GAP_PX }}>
            <TopInfoMessage content={content} />
          </div>
          <div
            className="flex shrink-0 items-center"
            style={{ paddingRight: GAP_PX }}
            aria-hidden="true"
          >
            <TopInfoMessage content={content} />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes top-info-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}