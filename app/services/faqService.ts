import { API_BASE_URL } from "./api";

export interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
}

export interface FAQPageData {
  pageTitle: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  faqs: FAQItem[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  seoSchema?: string;
}

export const getFaqPageData = async (): Promise<FAQPageData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/faq`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const data = await response.json();
    if (data.success) {
      return data.page;
    }
    return null;
  } catch (error) {
    console.error("Error fetching FAQ data:", error);
    return null;
  }
};
