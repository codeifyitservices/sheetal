import { API_BASE_URL } from "../services/api";
import HomeBannerCarousel, {
  type BannerItem,
} from "./HomeBannerCarousel";

async function getBanners(): Promise<BannerItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/banner`, {
      cache: "no-store",
    });
    const data = await response.json();
    return data?.success && Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

const HomeBanner = async () => {
  const banners = await getBanners();
  return <HomeBannerCarousel banners={banners} />;
};

export default HomeBanner;
