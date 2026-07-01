import React from "react";
import Link from "next/link";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { getSeoSettings } from "../services/seoSettingsService";
import { getFaqPageData } from "../services/faqService";
import { buildFaqSchema, parseSchemaString } from "../utils/schema";
import type { Metadata } from "next";
import { FaqAccordionItem } from "./FaqAccordionItem";

export async function getFaqMetadata(): Promise<Metadata> {
  const [data, seoSettings] = await Promise.all([
    getFaqPageData(),
    getSeoSettings(),
  ]);

  const title =
    data?.metaTitle || data?.pageTitle || "Frequently Asked Questions";
  const description =
    data?.metaDescription ||
    `Find answers to frequently asked questions about ${seoSettings.websiteName || "Studio By Sheetal"}`;
  const canonical =
    data?.canonicalUrl ||
    `${seoSettings.websiteUrl || "https://studiobysheetal.com"}/faq`;

  return {
    title,
    description,
    keywords: data?.metaKeywords || "",
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: data?.ogImage ? [{ url: data.ogImage, alt: title }] : [],
      type: "website",
    },
  };
}

const FAQPage = async () => {
  const [data, seoSettings] = await Promise.all([
    getFaqPageData(),
    getSeoSettings(),
  ]);

  if (!data) {
    return <div className="p-20 text-center">Loading...</div>;
  }
  console.log(data);

  const schema =
    parseSchemaString(data?.seoSchema) || buildFaqSchema(data, seoSettings);

  return (
    <>
      <JsonLd data={schema} />

      <div
        style={{
          backgroundImage: "url(/assets/bg.jpg)",
        }}
        className="md:mt-[50px] flex justify-center"
      >
        <div className="w-5xl px-6 py-10">
          {/* ── Header row ── */}
          <div className="flex items-center mt-10 justify-between mb-8">
            <h1 className="font-optima text-[32px] md:text-[38px] text-[#7a4e1a] font-normal leading-tight tracking-wide">
              Frequently Asked Questions
            </h1>

            <div className="flex items-center gap-4 shrink-0 ml-8">
              <span className="hidden sm:block font-[family-name:var(--font-montserrat)] font-medium text-[15px] text-black whitespace-nowrap">
                {data.ctaText ? data.ctaText : "Still need help?"}
              </span>
              <Link
                href={data.ctaButtonLink || "/contact"}
                className="border border-[#cccccc] text-black font-[family-name:var(--font-montserrat)] text-[15px] tracking-wider px-4 py-2 hover:text-[#9c6000] transition-colors duration-200 whitespace-nowrap"
              >
                {data.ctaButtonText || "Contact Us"}
              </Link>
            </div>
          </div>

          {/* ── Divider — matches the heavier line in desired image ── */}
          <hr className="border-t border-[#c8bba8] mb-0" />

          {/* ── FAQ accordion list ── */}
          <div>
            {(data.faqs || [])
              .filter((faq) => faq.isActive)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((faq, index) => (
                <FaqAccordionItem
                  key={faq._id || index}
                  question={faq.question || ""}
                  answer={faq.answer || ""}
                />
              ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FAQPage;
