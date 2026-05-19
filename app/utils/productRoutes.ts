type ProductLike = {
  slug?: string;
  id?: string;
  _id?: string;
  category?: { slug?: string } | string | null;
  categorySlug?: string | null;
  data?: ProductLike | null;
};

const unwrapProduct = (product: ProductLike | null | undefined): ProductLike => {
  if (!product) return {};
  return product.data && typeof product.data === "object" ? product.data : product;
};

export const getProductSlug = (
  product: ProductLike | null | undefined,
): string => {
  const resolved = unwrapProduct(product);
  return String(resolved.slug || resolved.id || resolved._id || "").trim();
};

export const getProductCategorySlug = (
  product: ProductLike | null | undefined,
): string => {
  const resolved = unwrapProduct(product);

  if (resolved.categorySlug) {
    return String(resolved.categorySlug).trim();
  }

  if (resolved.category && typeof resolved.category === "object") {
    return String(resolved.category.slug || "").trim();
  }

  return "";
};

export const buildProductHref = (
  product: ProductLike | null | undefined,
  options?: { scroll?: string },
): string => {
  const slug = getProductSlug(product);
  if (!slug) return "/product-list";

  const categorySlug = getProductCategorySlug(product);
  const pathname = categorySlug
    ? `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`
    : `/product/${encodeURIComponent(slug)}`;

  if (!options?.scroll) {
    return pathname;
  }

  const search = new URLSearchParams({ scroll: options.scroll });
  return `${pathname}?${search.toString()}`;
};

export const buildProductReviewsHref = (
  product: ProductLike | null | undefined,
): string => {
  const productHref = buildProductHref(product);
  if (productHref === "/product-list") {
    return productHref;
  }

  return `${productHref.replace(/\?.*$/, "")}/reviews`;
};
