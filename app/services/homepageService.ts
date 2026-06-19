import { apiFetch } from "./api";

export interface HomepageSections {
  topInfo?: boolean;
  homeBanner?: boolean;
  aboutSBS?: boolean;
  hiddenBeauty?: boolean;
  trendingThisWeek?: boolean;
  newArrivals?: boolean;
  collections?: boolean;
  timelessWomenCollection?: boolean;
  instagramDiaries?: boolean;
  testimonials?: boolean;
  blogs?: boolean;
  bookAppointmentWidget?: boolean;
}

export interface TopInfoConfig {
  mode: "coupon" | "custom" | "hidden";
  customText: string;
  customCtaLabel: string;
  customCtaHref: string;
}

export interface AboutSBSContent {
  heading: string;
  subheading: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

export interface HiddenBeautyContent {
  heading: string;
  subheading: string;
  categories: any[];
}

export interface CollectionsContent {
  heading: string;
  subheading: string;
  products: any[];
}

export interface TrendingThisWeekContent {
  heading: string;
  subheading: string;
  products: any[];
}

export interface NewArrivalsContent {
  heading: string;
  subheading: string;
  products: any[];
  buttonText: string;
  buttonUrl: string;
}

export interface InstagramDiariesContent {
  heading: string;
  subheading: string;
}

export interface TestimonialsContent {
  heading: string;
  subheading: string;
}

export interface BlogsContent {
  heading: string;
}

export interface HomepageSettings {
  sections: HomepageSections;
  topInfoConfig: TopInfoConfig;
  aboutSBS: AboutSBSContent;
  hiddenBeauty: HiddenBeautyContent;
  collections: CollectionsContent;
  trendingThisWeek: TrendingThisWeekContent;
  newArrivals: NewArrivalsContent;
  instagramDiaries: InstagramDiariesContent;
  testimonials: TestimonialsContent;
  blogs: BlogsContent;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schema?: string;
}

export const defaultTopInfoConfig: TopInfoConfig = {
  mode: "coupon",
  customText: "",
  customCtaLabel: "Shop Now",
  customCtaHref: "/product-list",
};

const defaultSections: HomepageSections = {
  topInfo: true,
  homeBanner: true,
  aboutSBS: true,
  hiddenBeauty: true,
  trendingThisWeek: true,
  newArrivals: true,
  collections: true,
  timelessWomenCollection: true,
  instagramDiaries: true,
  testimonials: true,
  blogs: true,
  bookAppointmentWidget: true,
};

export const getHomepageSettings = async (): Promise<HomepageSettings> => {
  const result = await apiFetch("/homepage/sections");

  return {
    sections: {
      ...defaultSections,
      ...(result?.sections || {}),
    },
    topInfoConfig: {
      ...defaultTopInfoConfig,
      ...(result?.topInfoConfig || {}),
    },
    aboutSBS: result?.aboutSBS || {},
    hiddenBeauty: result?.hiddenBeauty || { categories: [] },
    collections: result?.collections || { products: [] },
    trendingThisWeek: result?.trendingThisWeek || { products: [] },
    newArrivals: result?.newArrivals || { products: [] },
    instagramDiaries: result?.instagramDiaries || {},
    testimonials: result?.testimonials || {},
    blogs: result?.blogs || { heading: "Latest Articles & Blogs" },
    metaTitle: result?.metaTitle || "",
    metaDescription: result?.metaDescription || "",
    metaKeywords: result?.metaKeywords || "",
    canonicalUrl: result?.canonicalUrl || "",
    ogImage: result?.ogImage || "",
    schema: result?.schema || "",
  };
};

export const isTopInfoVisible = (
  sections?: HomepageSections | null,
  topInfoConfig?: Partial<TopInfoConfig> | null,
) => {
  if (sections?.topInfo === false) return false;
  return (topInfoConfig?.mode || defaultTopInfoConfig.mode) !== "hidden";
};

export const isExternalHref = (href?: string | null) =>
  Boolean(href && /^(https?:\/\/|mailto:|tel:)/i.test(href));
