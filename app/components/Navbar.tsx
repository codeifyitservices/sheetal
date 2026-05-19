import {
  isTopInfoVisible,
} from "../services/homepageService";
import { buildNavbarNavItems } from "./navbarLayout";
import NavbarInner from "./NavbarInner";
import { getStorefrontNavbarData } from "./storefrontHeaderData";

const NavbarFallback = () => (
  <div className="fixed left-0 right-0 top-0 z-[1003] h-[90px] bg-[#082722]/90 backdrop-blur-sm" />
);

const Navbar = async () => {
  let navbarData: Awaited<ReturnType<typeof getStorefrontNavbarData>> | null =
    null;

  try {
    navbarData = await getStorefrontNavbarData();
  } catch {
    navbarData = null;
  }

  if (!navbarData) {
    return <NavbarFallback />;
  }

  return (
    <NavbarInner
      initialNavItems={buildNavbarNavItems(
        navbarData.categories,
        navbarData.settings?.navbarLayout,
      )}
      topInfoEnabled={isTopInfoVisible(
        navbarData.homepageSettings?.sections,
        navbarData.homepageSettings?.topInfoConfig,
      )}
    />
  );
};

export default Navbar;
