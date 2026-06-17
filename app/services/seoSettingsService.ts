import { apiFetch } from "./api";

export interface SeoSocialLink {
  platform?: string;
  url?: string;
}

export interface SeoSettings {
  websiteName?: string;
  websiteUrl?: string;
  organizationName?: string;
  organizationDescription?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialMediaLinks?: SeoSocialLink[];
  schema?: string;
}

export const getSeoSettings = async (): Promise<SeoSettings> => {
  const result = await apiFetch("/seo-settings");
  return result?.settings || {};
};
