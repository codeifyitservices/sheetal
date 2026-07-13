// app/[category]/page.tsx
import React from "react";
import ProductList from "../product-list/page";
import { Metadata } from "next";
import { fetchCategoryBySlugServer } from "../services/categoryService";
import { notFound } from "next/navigation";
import { getSeoSettings } from "../services/seoSettingsService";
import JsonLd from "../components/JsonLd";
import { buildCategorySchema, parseSchemaString } from "../utils/schema";
import { fetchStaticPageBySlug } from "../services/staticPageService";
import StaticPage from "../components/StaticPage";

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
    const page = await fetchStaticPageBySlug(category);
    if (page) {
      const title =
        page.metaTitle ||
        (page.title
          ? `${page.title} | ${seoSettings.websiteName || "Studio By Sheetal"}`
          : (seoSettings.websiteName || "Studio By Sheetal"));
      const description = page.metaDescription || seoSettings.organizationDescription || "";
      const canonical =
        page.canonicalUrl ||
        `${seoSettings.websiteUrl || "https://studiobysheetal.com"}/${page.slug}`;
      const ogTitle = page.ogTitle || title;
      const ogDescription = page.ogDescription || description;

      return {
        title,
        description,
        keywords: page.metaKeywords || "",
        alternates: {
          canonical,
        },
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          url: canonical,
          siteName: seoSettings.websiteName || "Studio By Sheetal",
          images: page.ogImage
            ? [{ url: page.ogImage, width: 1200, height: 630, alt: ogTitle }]
            : [],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: ogTitle,
          description: ogDescription,
          images: page.ogImage ? [page.ogImage] : [],
        },
      };
    }

    return {
      title: "Page Not Found | Studio By Sheetal",
    };
  }

  const title = cat.metaTitle || `${cat.name} | ${seoSettings.websiteName || "Studio By Sheetal"}`;
  const description =
    cat.metaDescription ||
    cat.description ||
    seoSettings.organizationDescription ||
    `Shop ${cat.name} at ${seoSettings.websiteName || "Studio By Sheetal"}`;
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
    const page = await fetchStaticPageBySlug(category);
    if (page) return <StaticPage page={page} />;
    notFound();
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
