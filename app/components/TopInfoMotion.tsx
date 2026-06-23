"use client";

import React, { useEffect, useState } from "react";

const TOP_INFO_HEIGHT = 27;
const SCROLL_THRESHOLD = 50;

const TopInfoMotion = ({ children }: { children: React.ReactNode }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
    };
  }, []);

  return (
    <div style={{ height: TOP_INFO_HEIGHT }}>
      <div
        className={`fixed left-0 right-0 top-0 z-[1004] transition-transform duration-300 ${
          scrolled ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default TopInfoMotion;
