import { apiFetch, getApiImageUrl } from "./api";
import { Product } from "./productService";
import { User } from "./userService";

export interface BlogImage {
  url: string;
  public_id?: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: User;
  authorName?: string;
  bannerImage: BlogImage;
  contentImage?: BlogImage;
  imageAlt?: string;
  tags: string[];
  relatedProducts: Product[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: BlogImage;
  canonicalUrl?: string;
  status: "Active" | "Inactive";
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  success: boolean;
  blogs: Blog[];
  total: number;
  page: number;
  pages: number;
}

export interface BlogDetailResponse {
  success: boolean;
  data: Blog;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BlogFetchOptions {
  incrementView?: boolean;
}

export const getBlogs = async (
  params: BlogListParams = {},
): Promise<BlogListResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);

  return apiFetch(`/blogs?${query.toString()}`);
};

export const getBlogBySlug = async (
  slug: string,
  options: BlogFetchOptions = {},
): Promise<BlogDetailResponse> => {
  const query = new URLSearchParams();
  if (options.incrementView === false) {
    query.append("incrementView", "false");
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/blogs/post/${slug}${suffix}`);
};

export const getBlogImageUrl = (
  blog: Blog | undefined,
  fallback: string = "/assets/placeholder-product.jpg",
) => {
  if (!blog) return fallback;
  return getApiImageUrl(blog.bannerImage, fallback);
};
