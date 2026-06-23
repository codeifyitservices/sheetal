import { getApiImageUrl } from "../services/api";
import type { Category } from "../services/categoryService";
import type { Product } from "../services/productService";
import type { SeoSettings } from "../services/seoSettingsService";

interface CmsPage {
  title?: string;
  slug?: string;
  content?: unknown;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  schema?: string;
}

interface HomepageSeoData {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  schema?: string;
}

const DEFAULT_WEBSITE_URL = "https://studiobysheetal.com";
const DEFAULT_WEBSITE_NAME = "Studio By Sheetal";

const normalizeUrl = (value?: string) =>
  String(value || DEFAULT_WEBSITE_URL).replace(/\/+$/, "");

const extractTiptapText = (value: any): string => {
  if (!value || typeof value !== "object") return "";
  if (typeof value.text === "string") return value.text;
  if (!Array.isArray(value.content)) return "";
  return value.content.map(extractTiptapText).filter(Boolean).join(" ");
};

const stripHtml = (value: unknown = "") =>
  String(
    typeof value === "object" && value !== null ? extractTiptapText(value) : value,
  )
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const parseSchemaString = (value?: string | null) => {
  if (!value?.trim()) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const buildOrganizationSchema = (settings?: SeoSettings) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);
  const sameAs =
    settings?.socialMediaLinks
      ?.map((item) => item?.url?.trim())
      .filter(Boolean) || [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.organizationName || DEFAULT_WEBSITE_NAME,
    description: stripHtml(settings?.organizationDescription || ""),
    url: websiteUrl,
    ...(settings?.logo ? { logo: settings.logo } : {}),
    ...(settings?.contactPhone || settings?.contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(settings?.contactPhone
              ? { telephone: settings.contactPhone }
              : {}),
            ...(settings?.contactEmail ? { email: settings.contactEmail } : {}),
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
};

export const buildWebsiteSchema = (settings?: SeoSettings) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.websiteName || DEFAULT_WEBSITE_NAME,
    url: websiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${websiteUrl}/product-list?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

export const buildGlobalSchema = (settings?: SeoSettings) => [
  buildOrganizationSchema(settings),
  buildWebsiteSchema(settings),
];

export const buildProductSchema = (
  product: Product,
  settings?: SeoSettings,
) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);
  const categorySlug = product.category?.slug || product.categorySlug;
  const fallbackUrl =
    categorySlug && product.slug
      ? `${websiteUrl}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(product.slug)}`
      : `${websiteUrl}/product/${encodeURIComponent(product.slug)}`;

  const prices = (product.variants || [])
    .flatMap((variant) => variant.sizes || [])
    .map((size) =>
      Number(size.discountPrice) > 0 ? Number(size.discountPrice) : Number(size.price),
    )
    .filter((price) => Number.isFinite(price) && price >= 0);

  const image = [
    product.ogImage ? getApiImageUrl(product.ogImage, "") : "",
    getApiImageUrl(product.mainImage, ""),
    ...(product.images || []).map((item) => getApiImageUrl(item, "")),
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.metaTitle || product.name,
    description:
      product.metaDescription ||
      stripHtml(product.shortDescription) ||
      stripHtml(product.description),
    image,
    sku: product.sku,
    url: product.canonicalUrl || fallbackUrl,
    brand: {
      "@type": "Brand",
      name: product.brandInfo || settings?.organizationName || DEFAULT_WEBSITE_NAME,
    },
    offers: {
      "@type": "AggregateOffer",
      url: product.canonicalUrl || fallbackUrl,
      priceCurrency: "INR",
      lowPrice: prices.length ? Math.min(...prices) : 0,
      highPrice: prices.length ? Math.max(...prices) : 0,
      offerCount: prices.length || 1,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
          },
        }
      : {}),
  };
};

export const buildCategorySchema = (
  category: Category,
  settings?: SeoSettings,
) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.metaTitle || category.name,
    description: category.metaDescription || category.description || "",
    url:
      category.canonicalUrl ||
      `${websiteUrl}/${encodeURIComponent(category.slug)}`,
  };
};

export const buildPageSchema = (page: CmsPage, settings?: SeoSettings) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle || page.title || DEFAULT_WEBSITE_NAME,
    description:
      page.metaDescription || stripHtml(page.content || "").slice(0, 160),
    url:
      page.canonicalUrl ||
      (page.slug ? `${websiteUrl}/${encodeURIComponent(page.slug)}` : websiteUrl),
  };
};

export const buildHomepageSchema = (
  homepage: HomepageSeoData,
  settings?: SeoSettings,
) => {
  const websiteUrl = normalizeUrl(settings?.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: homepage.metaTitle || settings?.websiteName || DEFAULT_WEBSITE_NAME,
    description:
      homepage.metaDescription ||
      settings?.organizationDescription ||
      DEFAULT_WEBSITE_NAME,
    url: homepage.canonicalUrl || websiteUrl,
  };
};

export const buildFaqSchema = (faqPage: any, settings?: SeoSettings) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqPage.faqs || [])
      .filter((faq: any) => faq.isActive)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((faq: any) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: stripHtml(faq.answer),
        },
      })),
  };
};
