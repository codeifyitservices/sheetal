import { apiFetch, getApiImageUrl } from "./api";
import type { SizeChartData } from "./sizeChartService";

export const fetchWishlist = async (): Promise<{
  success: boolean;
  data: Product[];
}> => {
  return apiFetch("/users/wishlist");
};

export const toggleWishlist = async (productId: string) => {
  return apiFetch("/users/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });
};

export interface ProductImage {
  url: string;
  alt: string;
  isDefault?: boolean;
}

export interface VariantGalleryImage {
  url: string;
  alt?: string;
  public_id?: string;
}

export interface ProductVariant {
  _id: string;
  v_sku?: string;
  sizes: {
    name: string;
    stock: number;
    price: number;
    discountPrice: number;
  }[];
  color?: {
    name: string;
    code: string;
    swatchImage?: string;
  };
  v_image?: {
    url: string;
    public_id?: string;
  };
  v_video?: {
    url: string;
    public_id?: string;
    mimeType?: string;
    size?: number;
  };
  gallery?: VariantGalleryImage[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  previousSlugs?: string[];
  sku: string;
  shortDescription: string;
  description: string;
  materialCare: string;
  isStarred?: boolean;
  gstPercent: number;
  price?: number;
  categorySlug?: string;
  discountPrice?: number;

  mainImage: ProductImage;
  hoverImage?: ProductImage;
  images: ProductImage[];
  video?: {
    url: string;
    mimeType: string;
    size: number;
  };
  ogImage?: string;

  variants: ProductVariant[];
  category: {
    _id: string;
    name: string;
    slug: string;
    sizeChart?: SizeChartData | null;
  };
  sizeChart?: SizeChartData | null;

  status: string;
  isActive?: boolean;
  stock: number;

  displayCollections: string[];
  eventTags: string[];
  wearType?: string[];
  occasion?: string[];
  tags?: string[];
  style?: string[];
  work?: string[];
  fabric?: string[];
  productType?: string[];
  subCategory?: string;

  brandInfo?: string;
  warranty: string;
  returnPolicy: string;
  specifications: { key: string; value: string }[];
  keyBenefits: string[];

  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  schema?: string;

  averageRating: number;
  totalReviews: number;
  similarProducts?: Product[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  category?: string; // ID or comma-separated IDs
  subCategory?: string; // String
  brand?: string;
  status?: string;
  color?: string;
  fabric?: string; // comma-separated or single value
  minPrice?: number;
  maxPrice?: number;
  ids?: string;
}

export interface ProductResponse {
  success: boolean;
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
}

export const fetchProducts = async (
  params: ProductQueryParams = {},
): Promise<ProductResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.ids) query.append("ids", params.ids);
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.sort) query.append("sort", params.sort);
  if (params.category) query.append("category", params.category);
  if (params.subCategory) query.append("subCategory", params.subCategory);
  if (params.brand) query.append("brand", params.brand);
  if (params.color) query.append("color", params.color);
  if (params.fabric) query.append("fabric", params.fabric);
  if (params.minPrice != null)
    query.append("minPrice", params.minPrice.toString());
  if (params.maxPrice != null)
    query.append("maxPrice", params.maxPrice.toString());

  // Default to Active products if not specified
  if (!params.status) query.append("status", "Active");
  else query.append("status", params.status);

  return apiFetch(`/products?${query.toString()}`);
};

export const getNewArrivals = async (): Promise<{
  success: boolean;
  products: Product[];
}> => {
  return apiFetch("/products/new-arrivals");
};

export const fetchTrendingProducts = async (): Promise<{
  success: boolean;
  data: Product[];
}> => {
  return apiFetch("/products/trending");
};

export const fetchProductBySlug = async (slug: string) => {
  return apiFetch(`/products/${slug}`) as Promise<{
    success: boolean;
    data?: Product;
    redirectSlug?: string | null;
    message?: string;
  }>;
};

export const getProductImageUrl = (
  product: Product | undefined,
  fallback: string = "/assets/default-image.png",
) => {
  if (!product) return fallback;
  return getApiImageUrl(product.mainImage, fallback);
};

export const getProductHoverImageUrl = (
  product: Product | undefined,
  fallback: string = "/assets/default-image.png",
) => {
  if (!product) return fallback;
  if (!product.hoverImage) return fallback;
  return getApiImageUrl(product.hoverImage, fallback); // pass the whole object, same as mainImage
};

export const getProductGalleryUrls = (
  product: Product | null | undefined,
  fallback: string = "/assets/default-image.png",
) => {
  if (!product) return [fallback];

  const gallery = [
    getProductImageUrl(product, fallback),
    ...(product.images?.map((img) => getApiImageUrl(img, fallback)) || []),
  ].filter(Boolean);

  return Array.from(new Set(gallery));
};

export const getVariantGalleryUrls = (
  product: Product | null | undefined,
  variant: ProductVariant | null | undefined,
  fallback: string = "/assets/default-image.png",
) => {
  if (!product) return [fallback];

  const variantGallery = [
    ...(variant?.gallery?.map((img) => getApiImageUrl(img, fallback)) || []),
  ].filter(Boolean);

  if (variantGallery.length > 0) {
    return Array.from(new Set(variantGallery));
  }

  const variantImage = getApiImageUrl(variant?.v_image, "");
  if (variantImage) {
    return Array.from(
      new Set([variantImage, ...getProductGalleryUrls(product, fallback)]),
    );
  }

  return getProductGalleryUrls(product, fallback);
};

export const checkCanReview = async (productId: string) => {
  return apiFetch(`/products/can-review?productId=${productId}`, {
    method: "GET",
  });
};

export const addReview = async (
  productId: string,
  rating: number,
  comment: string,
) => {
  return apiFetch("/products/review", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, rating, comment }),
  });
};

export const fetchProductReviews = async (productId: string) => {
  return apiFetch(`/products/reviews?id=${productId}`, {
    method: "GET",
  });
};

export const incrementProductView = async (slug: string) => {
  try {
    await apiFetch(`/products/view/${slug}`, { method: "PATCH" });
  } catch (err) {
    // Silent fail — don't block UX for a view count
    console.error("View increment failed:", err);
  }
};

// In productService.ts — replace the existing getCollectionProducts function
// and add the CollectionProduct interface

export interface CollectionProduct {
  _id: string;
  name: string;
  slug: string;
  status?: string;
  image: string;
  imageAlt: string;
  hoverImage: string;
  hoverImageAlt: string;
  price: string | null;
  mrp: string | null;
  discount: string | null;
  soldOut: boolean;
  averageRating?: number;
}

export const getCollectionProducts = async (): Promise<CollectionProduct[]> => {
  const res: { success: boolean; products: CollectionProduct[] } =
    await apiFetch("/products/collections");
  return res?.products ?? [];
};
