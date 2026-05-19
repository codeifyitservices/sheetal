import { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import Footer from "../../components/Footer";
import ProductDetailClient from "../../product/components/ProductDetailClient";
import { fetchProductBySlug } from "../../services/productService";
import { getApiImageUrl } from "../../services/api";
import { buildProductHref, getProductCategorySlug } from "../../utils/productRoutes";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ category: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;

  try {
    const res = await fetchProductBySlug(productId);

    if (!res.success || !res.data) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    const product = res.data;
    const canonicalPath = buildProductHref(product);
    const canonicalUrl =
      product.canonicalUrl || `https://yourdomain.com${canonicalPath}`;
    const productPriceAmount =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

    const title = product.metaTitle;
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
        "product:brand": product.brandInfo || "Your Brand",
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

  const price =
    product?.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product?.price;
  const priceValidUntil = "2099-12-31";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: getApiImageUrl(product.mainImage?.url),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brandInfo || "Your Brand Name",
    },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "INR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://yourdomain.com${buildProductHref(product)}`,
      priceValidUntil,
    },
    aggregateRating:
      product.totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailClient slug={productId} />
      <Footer />
    </>
  );
}
