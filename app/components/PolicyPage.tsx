import React from "react";
import Link from "next/link";
import Footer from "./Footer";
import { API_BASE_URL } from "../services/api";
import JsonLd from "./JsonLd";
import { getSeoSettings } from "../services/seoSettingsService";
import { buildPageSchema, parseSchemaString } from "../utils/schema";
import type { Metadata } from "next";

interface PolicyPageProps {
  slug: string;
}

interface PageData {
  title: string;
  content: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schema?: string;
  seoSchema?: string;
}

const pageDefaults: Record<string, { title: string; content: string }> = {
  "terms-and-conditions": {
    title: "Terms & Conditions",
    content: "<p>Page content is being updated. Please check back later.</p>",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: "<p>Page content is being updated. Please check back later.</p>",
  },
  "shipping-policy": {
    title: "Shipping Policy",
    content: "<p>Page content is being updated. Please check back later.</p>",
  },
  "return-exchange-policy": {
    title: "Return & Exchange Policy",
    content: "<p>Page content is being updated. Please check back later.</p>",
  },
};

export async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/pages/slug/${slug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    return json.success && json.page ? json.page : null;
  } catch {
    return null;
  }
}

export async function getPolicyMetadata(slug: string): Promise<Metadata> {
  const [data, seoSettings] = await Promise.all([
    getPageData(slug),
    getSeoSettings(),
  ]);

  const fallback =
    pageDefaults[slug] || {
      title: slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      content: "",
    };

  const title = data?.metaTitle || data?.title || fallback.title;
  const description =
    data?.metaDescription ||
    `Read the ${fallback.title} of ${seoSettings.websiteName || "Studio By Sheetal"}`;
  const canonical =
    data?.canonicalUrl ||
    `${seoSettings.websiteUrl || "https://studiobysheetal.com"}/${slug}`;

  return {
    title,
    description,
    keywords: data?.metaKeywords || "",
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: data?.ogImage ? [{ url: data.ogImage, alt: title }] : [],
      type: "website",
    },
  };
}

const PolicyPage = async ({ slug }: PolicyPageProps) => {
  const [data, seoSettings] = await Promise.all([
    getPageData(slug),
    getSeoSettings(),
  ]);
  const fallback =
    pageDefaults[slug] || {
      title: slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      content: "<p>Page content is being updated. Please check back later.</p>",
  };
  const title = data?.title || fallback.title;
  const htmlContent = data?.content || fallback.content;
  const schema =
    parseSchemaString(data?.seoSchema || data?.schema) ||
    buildPageSchema(
      {
        ...data,
        title,
        slug,
        content: htmlContent,
      },
      seoSettings,
    );

  return (
    <>
      <JsonLd data={schema} />
      <div className="container-fluid p-0 relative overflow-hidden md:mt-[75px] mb-[45px] text-center">
        <div className="relative py-12 bg-[#f9f6f0] border-b border-[#e9e0d1]">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-optima text-[36px] text-[#6a3f07] font-normal tracking-wide">
              {title}
            </h1>
            <div className="text-[#a2690f] mt-3 font-[family-name:var(--font-montserrat)] text-sm tracking-widest uppercase">
              <Link href="/" className="hover:text-[#6a3f07] transition-colors">
                Home
              </Link>
              <span className="mx-3">/</span>
              <span>{title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <div 
          className="prose max-w-none policy-content font-[family-name:var(--font-montserrat)] text-sm md:text-base text-stone-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <Footer />
    </>
  );
};

export default PolicyPage;
