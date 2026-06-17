import { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import Footer from "../../components/Footer";
import ProductDetailClient from "../../product/components/ProductDetailClient";
import { fetchProductBySlug } from "../../services/productService";
import { getApiImageUrl } from "../../services/api";
import { buildProductHref, getProductCategorySlug } from "../../utils/productRoutes";
import JsonLd from "../../components/JsonLd";
import { getSeoSettings } from "../../services/seoSettingsService";
import { buildProductSchema, parseSchemaString } from "../../utils/schema";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ category: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;

  try {
    const [res, seoSettings] = await Promise.all([
      fetchProductBySlug(productId),
      getSeoSettings(),
    ]);

    if (!res.success || !res.data) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    const product = res.data;
    const canonicalPath = buildProductHref(product);
    const canonicalUrl =
      product.canonicalUrl ||
      `${seoSettings.websiteUrl || "https://studiobysheetal.com"}${canonicalPath}`;
    const productPriceAmount =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

    const title = product.metaTitle || `${product.name} | Studio By Sheetal`;
    const description =
      product.metaDescription ||
      product.shortDescription ||
      product.description?.substring(0, 160);
    const keywords =
      product.metaKeywords ||
      `${product.name}, ${product.category?.name}, buy ${product.name}`;

    const imageUrl = product.ogImage
      ? getApiImageUrl(product.ogImage)
      : getApiImageUrl(product.mainImage?.url);

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.mainImage?.alt || product.name,
          },
        ],
        type: "website",
        url: canonicalUrl,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: product.status === "Active" && product.isActive,
        follow: true,
      },
      other: {
        "product:price:amount": productPriceAmount?.toString() || "",
        "product:price:currency": "INR",
        "product:availability": product.stock > 0 ? "in stock" : "out of stock",
        "product:condition": "new",
        "product:brand":
          product.brandInfo || seoSettings.organizationName || "Studio By Sheetal",
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product | Your Store Name",
      description: "Shop our latest products",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category, productId } = await params;

  let product = null;
  let redirectSlug: string | null = null;
  try {
    const res = await fetchProductBySlug(productId);
    if (res.success && res.data) {
      product = res.data;
      redirectSlug = res.redirectSlug || null;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
  }

  if (!product) {
    redirect("/product-list");
  }

  if (redirectSlug && redirectSlug !== productId) {
    permanentRedirect(buildProductHref(product));
  }

  const resolvedCategory = getProductCategorySlug(product);
  if (
    product.slug !== productId ||
    (resolvedCategory && resolvedCategory !== category)
  ) {
    permanentRedirect(buildProductHref(product));
  }

  const seoSettings = await getSeoSettings();
  const structuredData =
    parseSchemaString(product.schema) || buildProductSchema(product, seoSettings);

  return (
    <>
      <JsonLd data={structuredData} />
      <ProductDetailClient slug={productId} />
      <Footer />
    </>
  );
}
