import { Metadata } from "next";
import HomeBanner from "./components/HomeBanner";
import HomeBannerLoader from "./components/HomeBannerLoader";
import AboutSBS from "./components/AboutSBS";
import HiddenBeauty from "./components/HiddenBeauty";
import HomeDeferredSections from "./components/HomeDeferredSections";
import Footer from "./components/Footer";
import { Suspense } from "react";

import { getSettings, getLogoUrl } from "./services/settingsService";
import { getHomepageSettings } from "./services/homepageService";
import { getSeoSettings } from "./services/seoSettingsService";
import JsonLd from "./components/JsonLd";
import { buildHomepageSchema, parseSchemaString } from "./utils/schema";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, homepage, seoSettings] = await Promise.all([
    getSettings(),
    getHomepageSettings(),
    getSeoSettings(),
  ]);
  const logoUrl = homepage.ogImage || getLogoUrl(settings);
  const title =
    homepage.metaTitle ||
    seoSettings.websiteName ||
    "Studio By Sheetal | Timeless Elegance & Ethnic Wear";
  const description =
    homepage.metaDescription ||
    seoSettings.organizationDescription ||
    "Discover the finest collection of sarees and ethnic wear at Studio By Sheetal.";
  const canonical =
    homepage.canonicalUrl || seoSettings.websiteUrl || "https://studiobysheetal.com";

  return {
    title,
    description,
    keywords: homepage.metaKeywords || "",
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        { url: logoUrl, width: 1200, height: 630, alt: title },
      ],
      type: "website",
    },
  };
}

export default async function Home() {
  const settings = await getHomepageSettings();
  const seoSettings = await getSeoSettings();
  const s = settings.sections;
  const schema =
    parseSchemaString(settings.schema) || buildHomepageSchema(settings, seoSettings);

  return (
    <>
      <JsonLd data={schema} />
      <Suspense fallback={<HomeBannerLoader />}>
        {s?.homeBanner && <HomeBanner />}
      </Suspense>
      <Suspense>
        {s?.aboutSBS && <AboutSBS content={settings.aboutSBS} />}
        {s?.hiddenBeauty && <HiddenBeauty content={settings.hiddenBeauty} />}
        <HomeDeferredSections settings={settings} />
        <Footer />
      </Suspense>
    </>
  );
}
