"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

import { AboutSBSContent } from "../services/homepageService";

const AboutSBS = ({ content }: { content?: AboutSBSContent }) => {
  const {
    heading = "About SBS",
    subheading = "Innovate the Outfit",
    description = "Studio By Sheetal: a designer studio passionate about timeless elegance. Sheetal crafts exquisite sarees, suits, and Indo-Western outfits with meticulous attention to detail, luxurious fabrics, and contemporary flair. Each piece blends traditional charm with modern silhouettes, tailored to celebrate individuality.",
    buttonText = "Explore More",
    buttonUrl = "/about-us",
  } = content || {};

  return (
    <div className="container mx-auto pt-12 pb-12 relative home-page-why px-4 overflow-x-clip">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-0">
        <div className="lg:col-span-1">
          <div className="h-full flex flex-col justify-center items-center lg:items-start">
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="md:block hidden w-15 h-0.5 bg-[#a2690f]" />
              <h2 className="font-light text-[#6a3f07] font-optima whitespace-nowrap">
                {heading}
              </h2>
              <div className="md:block hidden w-15 h-0.5 bg-[#a2690f]" />
            </div>
            <h3 className="text-[26px] font-light lg:ml-22 font-optima text-[#a2690f] font-[family-name:var(--font-outfit)] text-center lg:text-left">
              {subheading}
            </h3>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0">
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative inline-block">
                <Image
                  src="/assets/990320548.png"
                  alt={heading}
                  width={400}
                  height={500}
                  className="max-w-[95%] h-auto"
                />
                <Image
                  src="/assets/roud-img.png"
                  className="absolute -bottom-5 -right-0 md:bottom-9 md:-right-[60px] animate-[circle_6s_linear_infinite] w-[100px] h-[100px] md:w-[150px] md:h-[150px]"
                  alt="Decoration"
                  width={150}
                  height={150}
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="w-full lg:w-[92%] mx-auto mt-1 text-center lg:text-right flex flex-col justify-center h-full">
                <div className="mb-8 lg:mb-[50px]">
                  <p className="text-[15px] text-black md:text-[20px] font-normal leading-relaxed md:leading-8 font-[family-name:var(--font-montserrat)] px-2 lg:px-0">
                    {description}
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <Link
                    href={buttonUrl}
                    className="inline-block border-y rounded-sm border-black text-black font-normal py-3 px-6 uppercase transition-all duration-500 font-[family-name:var(--font-montserrat)] hover:text-black hover:border-[#a2690f] duration-300"
                  >
                    {buttonText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes circle {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AboutSBS;
