import { unstable_cache } from "next/cache";
import { API_BASE_URL } from "../services/api";
import {
  defaultTopInfoConfig,
  type HomepageSections,
  type HomepageSettings,
} from "../services/homepageService";
import type { Category } from "../services/categoryService";

const STOREFRONT_HEADER_REVALIDATE_SECONDS = 300;

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
};

const fetchJson = async (path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS },
  });
  return response.json();
};

const getCachedHomepageSettings = unstable_cache(
  async (): Promise<HomepageSettings> => {
    try {
      const settingsJson = await fetchJson("/homepage/sections");
      return {
        sections: {
          ...defaultHomepageSettings.sections,
          ...(settingsJson?.sections || {}),
        },
        topInfoConfig: {
          ...defaultHomepageSettings.topInfoConfig,
          ...(settingsJson?.topInfoConfig || {}),
        },
      };
    } catch {
      return defaultHomepageSettings;
    }
  },
  ["storefront-homepage-settings"],
  { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS },
);

const getCachedNavbarData = unstable_cache(
  async (): Promise<{
    categories: Category[];
    settings: NavbarSettings;
    homepageSettings: HomepageSettings;
  }> => {
    try {
      const [categoriesJson, settingsJson, homepageSettings] =
        await Promise.all([
          fetchJson("/categories"),
          fetchJson("/settings"),
          getCachedHomepageSettings(),
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
  },
  ["storefront-navbar-data"],
  { revalidate: STOREFRONT_HEADER_REVALIDATE_SECONDS },
);

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

export const getStorefrontHomepageSettings = () => getCachedHomepageSettings();

export const getStorefrontNavbarData = () => getCachedNavbarData();

export const getStorefrontHomepageCoupon = () => getCachedHomepageCoupon();
