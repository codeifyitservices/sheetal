import React from "react";

const HomeBannerLoader = () => {
  return (
    <div className="relative w-full overflow-hidden bg-[#e9e0d1]/30 flex items-center justify-center aspect-[8/3] min-h-[640px] md:min-h-[640px] min-h-[100svh]">
      {/* Shimmer animation background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#e9e0d1]/10 via-[#e9e0d1]/40 to-[#e9e0d1]/10 animate-pulse" />
      {/* Elegant Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#bd9951]/20 border-t-[#bd9951] rounded-full animate-spin" />
        <p className="text-[#683e14] font-medium tracking-widest text-xs uppercase animate-pulse">Loading Gallery</p>
      </div>
    </div>
  );
};

export default HomeBannerLoader;
