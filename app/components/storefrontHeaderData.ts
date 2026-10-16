import { unstable_cache } from "next/cache";
import { API_BASE_URL } from "../services/api";
import {
  defaultTopInfoConfig,
  type HomepageSections,
  type HomepageSettings,
} from "../services/homepageService";
import type { Category } from "../services/categoryService";

const isDev = process.env.NODE_ENV === "development";
const STOREFRONT_HEADER_REVALIDATE_SECONDS = 30;

export type NavbarSettings = {
  navbarLayout?: {
    id: string;
    label: string;
    href?: string;
    hidden?: boolean;
    itemType?: "category" | "static" | "custom" | "link";
    categoryId?: string;
    categorySlug?: string;
  }[];
};

export interface HomepageCoupon {
  code: string;
  description: string;
  offerType: string;
  offerValue: number;
  buyQuantity?: number;
  getQuantity?: number;
  couponType: string;
  endDate?: string;
  scope?: "All" | "Category" | "Specific_Product";
  applicableIds?: Array<{ name?: string; slug?: string } | string>;
}

const defaultHomepageSections: HomepageSections = {
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

export const defaultHomepageSettings: HomepageSettings = {
  sections: defaultHomepageSections,
  topInfoConfig: defaultTopInfoConfig,
  aboutSBS: {
    heading: "",
    subheading: "",
    description: "",
    buttonText: "",
    buttonUrl: "",
  },
  hiddenBeauty: {
    heading: "",
    subheading: "",
    categories: [],
  },
  collections: {
    heading: "",
    subheading: "",
    products: [],
  },
  trendingThisWeek: {
    heading: "",
    subheading: "",
    products: [],
  },
  newArrivals: {
    heading: "",
    subheading: "",
    products: [],
    buttonText: "",
    buttonUrl: "",
  },
  instagramDiaries: {
    heading: "",
    subheading: "",
  },
  testimonials: {
    heading: "",
    subheading: "",
  },
  blogs: {
    heading: "",
  },
};

const fetchJson = async (path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...(isDev
      ? { cache: "no-store" }
      : { next: { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS } }),
  });
  return response.json();
};

const fetchJsonNoStore = async (path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });
  return response.json();
};

const parseHomepageSettings = (settingsJson: any): HomepageSettings => {
  return {
    ...defaultHomepageSettings,
    sections: {
      ...defaultHomepageSettings.sections,
      ...(settingsJson?.sections || {}),
    },
    topInfoConfig: {
      ...defaultHomepageSettings.topInfoConfig,
      ...(settingsJson?.topInfoConfig || {}),
    },
    aboutSBS: settingsJson?.aboutSBS || defaultHomepageSettings.aboutSBS,
    hiddenBeauty: settingsJson?.hiddenBeauty || defaultHomepageSettings.hiddenBeauty,
    collections: settingsJson?.collections || defaultHomepageSettings.collections,
    trendingThisWeek: settingsJson?.trendingThisWeek || defaultHomepageSettings.trendingThisWeek,
    newArrivals: settingsJson?.newArrivals || defaultHomepageSettings.newArrivals,
    instagramDiaries: settingsJson?.instagramDiaries || defaultHomepageSettings.instagramDiaries,
    testimonials: settingsJson?.testimonials || defaultHomepageSettings.testimonials,
    blogs: settingsJson?.blogs || defaultHomepageSettings.blogs,
    metaTitle: settingsJson?.metaTitle,
    metaDescription: settingsJson?.metaDescription,
    metaKeywords: settingsJson?.metaKeywords,
    canonicalUrl: settingsJson?.canonicalUrl,
    ogImage: settingsJson?.ogImage,
    schema: settingsJson?.schema,
  };
};

const fetchHomepageSettingsDirectly = async (): Promise<HomepageSettings> => {
  try {
    const settingsJson = await fetchJsonNoStore("/homepage/sections");
    return parseHomepageSettings(settingsJson);
  } catch {
    return defaultHomepageSettings;
  }
};

const getCachedHomepageSettings = unstable_cache(
  async (): Promise<HomepageSettings> => {
    try {
      const settingsJson = await fetchJson("/homepage/sections");
      return parseHomepageSettings(settingsJson);
    } catch {
      return defaultHomepageSettings;
    }
  },
  ["storefront-homepage-settings"],
  { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS },
);

const fetchHomepageCouponDirectly = async (): Promise<HomepageCoupon | null> => {
  try {
    const couponJson = await fetchJsonNoStore("/coupons/homepage");
    return (couponJson?.data || couponJson?.coupon || null) as HomepageCoupon | null;
  } catch {
    return null;
  }
};

const getCachedHomepageCoupon = unstable_cache(
  async (): Promise<HomepageCoupon | null> => {
    try {
      const couponJson = await fetchJson("/coupons/homepage");
      return (couponJson?.data || couponJson?.coupon || null) as HomepageCoupon | null;
    } catch {
      return null;
    }
  },
  ["storefront-homepage-coupon"],
  { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS },
);

export const getStorefrontHomepageSettings = (): Promise<HomepageSettings> => {
  if (isDev) {
    return fetchHomepageSettingsDirectly();
  }
  return getCachedHomepageSettings();
};

export const getStorefrontHomepageCoupon = (): Promise<HomepageCoupon | null> => {
  if (isDev) {
    return fetchHomepageCouponDirectly();
  }
  return getCachedHomepageCoupon();
};

const getNavbarData = async (): Promise<{
  categories: Category[];
  settings: NavbarSettings;
  homepageSettings: HomepageSettings;
}> => {
  try {
    const [categoriesJson, settingsJson, homepageSettings] =
      await Promise.all([
        fetchJsonNoStore("/categories"),
        fetchJsonNoStore("/settings"),
        getStorefrontHomepageSettings(),
      ]);

    return {
      categories: (categoriesJson?.data || []) as Category[],
      settings: (settingsJson?.data || {}) as NavbarSettings,
      homepageSettings,
    };
  } catch {
    return {
      categories: [],
      settings: {},
      homepageSettings: defaultHomepageSettings,
    };
  }
};

export const getStorefrontNavbarData = () => getNavbarData();
