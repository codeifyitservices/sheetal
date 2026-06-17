// app/[category]/page.tsx
import React from "react";
import ProductList from "../product-list/page";
import { Metadata } from "next";
import { fetchCategoryBySlugServer } from "../services/categoryService";
import { redirect } from "next/navigation";
import { getSeoSettings } from "../services/seoSettingsService";
import JsonLd from "../components/JsonLd";
import { buildCategorySchema, parseSchemaString } from "../utils/schema";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

// Direct server-side fetch — bypasses apiFetch which needs browser context


export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const [cat, seoSettings] = await Promise.all([
    fetchCategoryBySlugServer(category),
    getSeoSettings(),
  ]);

  if (!cat) {
    return {
      title: "Category | Studio By Sheetal",
      description: "Browse our collection",
    };
  }

  const title = cat.metaTitle || `${cat.name} | Studio By Sheetal`;
  const description =
    cat.metaDescription ||
    cat.description ||
    `Shop ${cat.name} at Studio By Sheetal`;
  const ogImageUrl = cat.ogImage || cat.mainImage?.url || "";
  const canonical =
    cat.canonicalUrl ||
    `${seoSettings.websiteUrl || "https://studiobysheetal.com"}/${category}`;

  return {
    title,
    description,
    keywords: cat.metaKeywords || "",
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seoSettings.websiteName || "Studio By Sheetal",
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: 1200, height: 630, alt: cat.name }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const [cat, seoSettings] = await Promise.all([
    fetchCategoryBySlugServer(category),
    getSeoSettings(),
  ]);
  
  if (!cat) {
    redirect("/");
  }

  const schema =
    parseSchemaString(cat.schema) || buildCategorySchema(cat, seoSettings);

  return (
    <>
      <JsonLd data={schema} />
      <ProductList categorySlug={category} />
    </>
  );
}
