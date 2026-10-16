const REDEMPTION_KEY = "coupon_redemptions_by_user";

const readStore = (): Record<string, string[]> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(REDEMPTION_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string[]>>((acc, [userId, value]) => {
      acc[userId] = Array.isArray(value)
        ? value.map((item) => String(item).toUpperCase())
        : [];
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const writeStore = (store: Record<string, string[]>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(REDEMPTION_KEY, JSON.stringify(store));
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const readLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isSingleUseCoupon = (meta?: unknown) => {
  if (!meta || typeof meta !== "object") return false;

  const record = meta as Record<string, unknown>;

  const onePerCustomerFlags = [
    record.oncePerCustomer,
    record.onePerCustomer,
    record.singleUsePerCustomer,
    record.restrictToOnePerCustomer,
  ];

  if (onePerCustomerFlags.some(Boolean)) {
    return true;
  }

  const perCustomerLimits = [
    readLimit(record.perCustomerLimit),
    readLimit(record.maxUsesPerCustomer),
    readLimit(record.maxRedemptionsPerCustomer),
    readLimit(record.usageLimitPerCustomer),
    readLimit(record.userUsageLimit),
    readLimit(record.usageLimitPerUser),
  ].filter((value): value is number => value !== null);

  return perCustomerLimits.some((limit) => limit === 1);
};

export const hasRedeemedCoupon = (userId: string, code: string) => {
  if (!userId || !code) return false;

  const store = readStore();
  const redeemed = store[userId] || [];
  return redeemed.includes(normalizeCode(code));
};

export const markCouponRedeemed = (userId: string, code: string) => {
  if (!userId || !code) return;

  const store = readStore();
  const redeemed = new Set(store[userId] || []);
  redeemed.add(normalizeCode(code));
  store[userId] = Array.from(redeemed);
  writeStore(store);
};

export const isCouponLimitReached = (
  coupon: any,
  userId?: string | null,
): { isReached: boolean; reason?: "total" | "user" } => {
  if (!coupon || typeof coupon !== "object") {
    return { isReached: false };
  }

  // 1. Total usage limit crossed
  const totalUsageLimit = Number(coupon.totalUsageLimit);
  const usedCount = Number(coupon.usedCount ?? 0);
  if (
    Number.isFinite(totalUsageLimit) &&
    totalUsageLimit > 0 &&
    usedCount >= totalUsageLimit
  ) {
    return { isReached: true, reason: "total" };
  }

  // 2. User usage limit crossed (if logged in)
  if (userId) {
    const userLimit = Number(coupon.usageLimitPerUser ?? 1);
    const normalizedUserId = String(userId).trim();

    // Check database usedBy array
    if (Array.isArray(coupon.usedBy)) {
      const userUsage = coupon.usedBy.find((entry: any) => {
        const entryUserId =
          typeof entry?.userId === "object" && entry?.userId !== null
            ? String(entry.userId._id || "")
            : String(entry?.userId || entry?.user || "");
        return entryUserId === normalizedUserId;
      });

      if (userUsage && Number(userUsage.count || 0) >= userLimit) {
        return { isReached: true, reason: "user" };
      }
    }

    // Check client-side single use redemption cache
    if (
      coupon.code &&
      isSingleUseCoupon(coupon) &&
      hasRedeemedCoupon(normalizedUserId, coupon.code)
    ) {
      return { isReached: true, reason: "user" };
    }
  }

  return { isReached: false };
};
