import HomeBanner from "./components/HomeBanner";
import HomeBannerLoader from "./components/HomeBannerLoader";
import AboutSBS from "./components/AboutSBS";
import HiddenBeauty from "./components/HiddenBeauty";
import { API_BASE_URL } from "./services/api";
import HomeDeferredSections from "./components/HomeDeferredSections";
import Footer from "./components/Footer";
import { Suspense } from "react";

async function getHomepageSections() {
  try {
    const res = await fetch(`${API_BASE_URL}/homepage/sections`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.sections;
  } catch {
    // Return all visible as fallback
    return null;
  }
}

export default async function Home() {
  const s = await getHomepageSections();
  return (
    <>
      <Suspense fallback={<HomeBannerLoader />}>
        {s?.homeBanner && <HomeBanner />}
      </Suspense>
      <Suspense>
        {s?.aboutSBS && <AboutSBS />}
        {s?.hiddenBeauty && <HiddenBeauty />}
        <HomeDeferredSections sections={s} />
        <Footer />
      </Suspense>
    </>
  );
}
