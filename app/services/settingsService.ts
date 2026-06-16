import { apiFetch } from "./api";

interface Settings {
  platformFee: number;
  shippingFee: number;
  freeShippingThreshold: number;
  taxPercentage: number;
  navbarLayout?: {
    id: string;
    label: string;
    href?: string;
    hidden?: boolean;
    itemType?: "category" | "static" | "custom" | "link";
    categoryId?: string;
    categorySlug?: string;
  }[];
  footerLayout?: any[]; // Footer sections with links
  prepaidShippingCharge: string;
  codShippingCharge: string;
  returnPolicyContent: string;
  supportEmail: string;
  supportWhatsapp: string;
  globalHsnCode?: string;
  deliveryPoint2?: string;
  deliveryPoint3?: string;
  platformFeeKnowMore?: string;
}

export const getSettings = async (): Promise<Settings> => {
  const result = await apiFetch("/settings");
  if (result.success && result.data) {
    return result.data;
  }
  return {
    platformFee: 0,
    shippingFee: 0,
    freeShippingThreshold: 0,
    taxPercentage: 0,
    navbarLayout: [],
    footerLayout: [],
    prepaidShippingCharge: "Free Shipping",
    codShippingCharge: "Free Shipping",
    returnPolicyContent: "Your satisfaction is our top priority. If you're not completely satisfied with the product, we offer a hassle-free, no questions asked 7 days return and refund.",
    supportEmail: "info@studiobysheetal.com",
    supportWhatsapp: "919958813913",
    deliveryPoint2: "Pay on delivery available",
    deliveryPoint3: "Easy 7 days return & exchange available",
  };
};
