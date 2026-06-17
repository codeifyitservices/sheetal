import { apiFetch, getApiImageUrl } from "./api";

export interface CategoryImage {
  url: string;
  public_id?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    public_id?: string;
  } | string;
  mainImage?: {
    url: string;
    public_id?: string;
  };
  bannerImage?: {
    url: string;
    public_id?: string;
  };
  parentCategory?: {
    _id: string;
    name: string;
  } | null;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schema?: string;
  // rest of your existing fields
  categoryBanner?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  status?: "Active" | "Inactive";
  subCategories?: string[];
  style?: string[];
  work?: string[];
  fabric?: string[];
  productType?: string[];
  wearType?: string[];
  occasion?: string[];
  byPrice?: string[];
  order?: number;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Fetch all active categories from the database
 */
export const fetchAllCategories = async (): Promise<Category[]> => {
  try {
    const data: ApiResponse<Category[]> = await apiFetch("/categories");
    return data.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

/**
 * Fetch a single category by slug
 */
export const fetchCategoryBySlug = async (
  slug: string,
): Promise<Category | null> => {
  try {
    const data: ApiResponse<Category> = await apiFetch(`/categories/${slug}`);
    return data.data || null;
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    // Fallback if endpoint not implemented yet
    try {
      const all: Category[] = await fetchAllCategories();
      return all.find((c) => c.slug === slug) || null;
    } catch {
      throw error;
    }
  }
};

/**
 * Get category image URL with fallback
 */
export const getCategoryImageUrl = (
  category: Category | undefined,
  fallback: string = "/assets/default-image.png",
): string => {
  if (!category) return fallback;

  const imageSource = category.mainImage || category.image;
  return getApiImageUrl(imageSource, fallback);
};

/**
 * Get category banner image URL with fallback
 */
export const getCategoryBannerUrl = (
  category: Category | undefined,
  fallback: string = "/assets/254852228.jpg", // Default banner
): string => {
  if (!category) return fallback;

  // Prioritize bannerImage for category banners
  return getApiImageUrl(category.bannerImage, fallback);
};

export const fetchCategoryBySlugServer = async (
  slug: string,
): Promise<Category | null> => {
  try {
    const res = await apiFetch(`/categories/${slug}`, {
      next: { revalidate: 3600 },
    });
    return res?.data ?? null;
  } catch (error) {
    console.error("Error fetching category by slug (server):", error);
    return null;
  }
};
