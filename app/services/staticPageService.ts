import { API_BASE_URL } from "./api";

export interface StaticPage {
  _id: string;
  title: string;
  slug: string;
  content: unknown;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  seoSchema?: string;
  status?: "Published" | "Draft";
  footerPlacement?:
    | "none"
    | "footer_column_1"
    | "footer_column_2"
    | "footer_column_3";
}

export interface FooterStaticPage {
  _id: string;
  title: string;
  slug: string;
  footerPlacement: "footer_column_1" | "footer_column_2" | "footer_column_3";
}

export const fetchStaticPageBySlug = async (
  slug: string,
): Promise<StaticPage | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages/slug/${slug}`, {
      cache: "no-store",
    });
    if (response.status === 404) return null;
    const data = await response.json();
    return data.success && data.page ? data.page : null;
  } catch {
    return null;
  }
};

export const fetchFooterStaticPages = async (): Promise<FooterStaticPage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages/public/footer`, {
      next: { revalidate: 300 },
    });
    const data = await response.json();
    return data.success && Array.isArray(data.pages) ? data.pages : [];
  } catch {
    return [];
  }
};
