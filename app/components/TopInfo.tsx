import {
  isTopInfoVisible,
} from "../services/homepageService";
import {
  defaultHomepageSettings,
  getStorefrontHomepageCoupon,
  getStorefrontHomepageSettings,
  type HomepageCoupon,
} from "./storefrontHeaderData";
import TopInfoMotion from "./TopInfoMotion";
import TopInfoScroller from "./TopInfoScroller";

const defaultText = "Check back soon for fresh offers.";

const getOfferText = (homepageCoupon: HomepageCoupon) => {
  if (homepageCoupon.offerType === "Percentage") {
    return `Up to ${homepageCoupon.offerValue}% Off`;
  }
  if (homepageCoupon.offerType === "FixedAmount") {
    return `Flat Rs.${homepageCoupon.offerValue} Off`;
  }
  if (homepageCoupon.offerType === "BOGO") return "Buy One Get One Free";
  return "";
};

const getCouponHref = (coupon: HomepageCoupon | null) => {
  const applicableItem =
    coupon?.applicableIds && coupon.applicableIds.length > 0
      ? coupon.applicableIds[coupon.applicableIds.length - 1]
      : null;
  const applicableSlug =
    applicableItem && typeof applicableItem === "object"
      ? applicableItem.slug || null
      : null;

  if (coupon?.scope === "Specific_Product" && applicableSlug) {
    return `/product/${applicableSlug}`;
  }
  if (coupon?.scope === "Category" && applicableSlug) {
    return `/${applicableSlug}`;
  }
  return "/product-list";
};

async function getTopInfoData() {
  try {
    const homepageSettings = await getStorefrontHomepageSettings();

    const topInfoVisible = isTopInfoVisible(
      homepageSettings.sections,
      homepageSettings.topInfoConfig,
    );
    const topInfoMode = homepageSettings.topInfoConfig?.mode || "coupon";

    if (!topInfoVisible) {
      return null;
    }

    if (topInfoMode !== "coupon") {
      return { homepageSettings, coupon: null };
    }

    try {
      return {
        homepageSettings,
        coupon: await getStorefrontHomepageCoupon(),
      };
    } catch {
      return { homepageSettings, coupon: null };
    }
  } catch {
    return {
      homepageSettings: defaultHomepageSettings,
      coupon: null,
    };
  }
}

const buildTopInfoContent = (topInfoData: Awaited<ReturnType<typeof getTopInfoData>>) => {
  if (!topInfoData) {
    return null;
  }

  const { homepageSettings, coupon } = topInfoData;

  const topInfoVisible = isTopInfoVisible(
    homepageSettings?.sections,
    homepageSettings?.topInfoConfig,
  );
  const topInfoMode = homepageSettings?.topInfoConfig?.mode || "coupon";

  if (!topInfoVisible) {
    return null;
  }

  if (topInfoMode === "custom") {
    return {
      text:
        homepageSettings?.topInfoConfig?.customText?.trim() || defaultText,
      code: null,
      href:
        homepageSettings?.topInfoConfig?.customCtaHref?.trim() ||
        "/product-list",
      ctaLabel:
        homepageSettings?.topInfoConfig?.customCtaLabel?.trim() ||
        "Shop Now",
    };
  }

  const isExpired = coupon?.endDate
    ? new Date(coupon.endDate) < new Date()
    : false;
  const hasValidCoupon = Boolean(coupon && !isExpired);
  const validCoupon = hasValidCoupon ? coupon : null;
  const displayText = validCoupon
    ? validCoupon.description || getOfferText(validCoupon)
    : defaultText;

  return {
    text: displayText,
    code: validCoupon?.couponType === "CouponCode" ? validCoupon.code : null,
    href: validCoupon ? getCouponHref(validCoupon) : "/product-list",
    ctaLabel: "Shop Now",
  };
};

export default async function TopInfo() {
  const topInfoData = await getTopInfoData();
  const content = buildTopInfoContent(topInfoData);

  if (!content) {
    return null;
  }

  return (
    <TopInfoMotion>
      <div className="h-[27px] overflow-hidden bg-[#f3bf43] font-[family-name:var(--font-montserrat)]">
        <div className="flex h-full items-center">
          <TopInfoScroller content={content} />
        </div>
      </div>
    </TopInfoMotion>
  );
}