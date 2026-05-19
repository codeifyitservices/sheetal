import Image from "next/image";
import Link from "next/link";
import { permanentRedirect, redirect } from "next/navigation";
import Footer from "../../../components/Footer";
import ProductReviews, {
  Review,
} from "../../../product/components/ProductReviews";
import {
  fetchProductBySlug,
  fetchProductReviews,
  getProductImageUrl,
  Product,
} from "../../../services/productService";
import {
  buildProductHref,
  buildProductReviewsHref,
  getProductCategorySlug,
} from "../../../utils/productRoutes";

export const dynamic = "force-dynamic";

interface ProductReviewsPageProps {
  params: Promise<{ category: string; productId: string }>;
}

export default async function ProductReviewsPage({
  params,
}: ProductReviewsPageProps) {
  const { category, productId } = await params;

  let product: Product | null = null;
  let redirectSlug: string | null = null;

  try {
    const res = await fetchProductBySlug(productId);
    if (res.success && res.data) {
      product = res.data;
      redirectSlug = res.redirectSlug || null;
    }
  } catch (error) {
    console.error("Error fetching product reviews page data:", error);
  }

  if (!product) {
    redirect("/product-list");
  }

  if (redirectSlug && redirectSlug !== productId) {
    permanentRedirect(buildProductReviewsHref(product));
  }

  const resolvedCategory = getProductCategorySlug(product);
  if (
    product.slug !== productId ||
    (resolvedCategory && resolvedCategory !== category)
  ) {
    permanentRedirect(buildProductReviewsHref(product));
  }

  let reviews: Review[] = [];
  try {
    const reviewRes = await fetchProductReviews(product._id);
    if (reviewRes.success && Array.isArray(reviewRes.data)) {
      reviews = reviewRes.data;
    }
  } catch (error) {
    console.error("Error fetching product reviews:", error);
  }

  const backHref = buildProductHref(product);
  const productImage = getProductImageUrl(
    product,
    "/assets/placeholder-product.jpg",
  );

  return (
    <>
      <main className="bg-[#f9f9f9] py-15 font-[family-name:var(--font-montserrat)]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            <aside className="lg:w-1/5">
              <Link
                href={backHref}
                className="mb-6 inline-flex items-center text-sm font-semibold uppercase tracking-[0.2em] text-[#a2690f] hover:text-[#7d4e07] transition-colors"
              >
                Back
              </Link>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={productImage}
                    alt={product.mainImage?.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                  />
                </div>
                <div className="p-5">
                  <h1 className="mb-3 text-xl font-medium text-[#683e14] font-[family-name:var(--font-optima)]">
                    {product.name}
                  </h1>
                  <p className="text-sm leading-6 text-gray-700">
                    {product.shortDescription || "No short description available."}
                  </p>
                </div>
              </div>
            </aside>

            <div className="lg:w-4/5 rounded-2xl bg-white p-4 shadow-sm md:p-8">
              <ProductReviews
                productId={product._id}
                initialReviews={reviews}
                overallRating={product.averageRating || 0}
                totalReviews={product.totalReviews || reviews.length}
                showFilters
                compactHeader
                stackedList
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
