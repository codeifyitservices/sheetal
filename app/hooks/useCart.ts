"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  fetchCart,
  addToCart as addToCartApi,
  removeFromCart as removeFromCartApi,
  applyCoupon as applyCouponApi,
  updateCartItemQuantity as updateCartItemQuantityApi,
  clearCart as clearCartApi,
  mergeGuestCart as mergeGuestCartApi,
  getSharedCart,
} from "../services/cartService";
import { getAllCouponsClient } from "../services/couponService";
import {
  toggleWishlist as toggleWishlistApi,
  Product,
} from "../services/productService";
import {
  AUTH_UPDATED_EVENT,
  getToken,
  getUserDetails,
  isAuthenticated,
} from "../services/authService";
import {
  CART_UPDATED_EVENT,
  dispatchCartItemAdded,
  dispatchCartUpdated,
  dispatchWishlistUpdated,
} from "./shopEvents";
import {
  hasRedeemedCoupon,
  isSingleUseCoupon,
  markCouponRedeemed,
} from "../utils/couponRedemption";

// ─── Guest cart localStorage key ────────────────────────────────────────────
const GUEST_CART_KEY = "guest_cart";
const COUPON_STATE_KEY = "cart_coupon_state";

/** Shape of a guest cart item stored in localStorage */
export interface GuestCartItem {
  /** Temporary client-side ID */
  _id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  discountPrice: number;
  variantImage: string;
  /** Minimal product info for display purposes */
  product: {
    _id: string;
    name: string;
    slug: string;
    mainImage?: { url: string };
  };
}

export interface CartItem {
  _id: string;
  product: Product;
  variantId?: string;
  quantity: number;
  color: string;
  size: string;
  variantImage?: string;
  price?: number;
  discountPrice?: number;
}

interface PersistedCouponState {
  couponCode: string;
  couponDiscount: number;
  couponOfferType: string | null;
  couponError: string | null;
  bogoMessage: string | null;
  applicableCategories: string[];
  itemWiseDiscount: { [cartItemId: string]: number } | null;
  couponMeta?: unknown;
}

interface CouponCandidate {
  code?: string;
  couponType?: string;
  isAutomatic?: boolean;
}

interface CartApiResponse {
  success: boolean;
  data: { items: CartItem[] };
}

interface UseCartReturn {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  couponCode: string;
  couponDiscount: number;
  couponError: string | null;
  couponOfferType: string | null;
  bogoMessage: string | null;
  applicableCategories: string[];
  itemWiseDiscount: { [cartItemId: string]: number } | null;
  couponMeta?: unknown;
  totalMrp: number;
  totalDiscount: number;
  finalAmount: number;
  addToCart: (
    productId: string,
    variantId: string,
    quantity: number,
    size: string,
    price: number,
    discountPrice: number,
    variantImage: string,
    color: string,
    productMeta?: { _id: string; name: string; slug: string; mainImage?: { url: string } },
  ) => Promise<void>;
  removeFromCart: (
    itemId: string,
    options?: { silent?: boolean },
  ) => Promise<void>;
  moveFromCartToWishlist: (
    itemId: string,
    productId: string,
    options?: { silent?: boolean },
  ) => Promise<void>;
  applyCoupon: (
    code: string,
    userId: string,
    couponMeta?: UseCartReturn["couponMeta"],
    options?: { silent?: boolean },
  ) => Promise<boolean>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeCoupon: (options?: { silent?: boolean }) => void;
  clearCart: (userId: string) => Promise<void>;
}

// ─── Guest cart helpers ──────────────────────────────────────────────────────

let cachedCartSnapshot: CartItem[] | null = null;

const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const readPersistedCouponState = (): PersistedCouponState | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(COUPON_STATE_KEY);
    return raw ? (JSON.parse(raw) as PersistedCouponState) : null;
  } catch {
    return null;
  }
};

const writePersistedCouponState = (state: PersistedCouponState | null) => {
  if (typeof window === "undefined") return;

  if (!state || !state.couponCode) {
    sessionStorage.removeItem(COUPON_STATE_KEY);
    return;
  }

  sessionStorage.setItem(COUPON_STATE_KEY, JSON.stringify(state));
};

const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

const readSharedCartToken = (): string => {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search)
    .get("sharedCartToken")
    ?.trim() || "";
};

/** Converts guest cart items to CartItem shape for uniform UI rendering */
const guestToCartItems = (guestItems: GuestCartItem[]): CartItem[] =>
  guestItems.map((g) => ({
    _id: g._id,
    product: g.product as unknown as Product,
    variantId: g.variantId,
    quantity: g.quantity,
    color: g.color,
    size: g.size,
    variantImage: g.variantImage,
    price: g.price,
    discountPrice: g.discountPrice,
  }));

const getInitialCartSnapshot = (): CartItem[] => {
  if (cachedCartSnapshot) {
    return cachedCartSnapshot;
  }

  if (typeof window === "undefined") {
    return [];
  }

  return isAuthenticated() ? [] : guestToCartItems(readGuestCart());
};

const commitCartSnapshot = (items: CartItem[]): CartItem[] => {
  cachedCartSnapshot = items;
  return items;
};

/** Clears guest cart from localStorage */
export const clearGuestCart = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_CART_KEY);
  }
};

/**
 * Merges the guest localStorage cart into the authenticated user's server cart.
 * Should be called immediately after a successful login.
 */
export const mergeGuestCartOnLogin = async (): Promise<void> => {
  const guestItems = readGuestCart();
  if (guestItems.length === 0) return;

  const payload = guestItems.map((g) => ({
    productId: g.productId,
    quantity: g.quantity,
    size: g.size,
    color: g.color,
    price: g.price,
    discountPrice: g.discountPrice,
    variantImage: g.variantImage,
  }));

  try {
    await mergeGuestCartApi(payload);

    // Only clear the local guest cart after the server cart reflects the merge.
    // This avoids losing the cart if the merge request succeeds but the cart
    // fetch is briefly stale or the backend fails to persist the items.
    const verification = await fetchCart();
    const mergedItems = verification?.success && verification.data && Array.isArray(verification.data.items)
      ? verification.data.items.filter((item: CartItem) => item.product != null)
      : [];

    if (mergedItems.length > 0) {
      clearGuestCart();
    }
  } catch (err) {
    console.error("Failed to merge guest cart:", err);
  }
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useCart = (): UseCartReturn => {
  const [sharedCartToken, setSharedCartToken] = useState(readSharedCartToken);
  const [cart, setCart] = useState<CartItem[]>(() =>
    sharedCartToken ? [] : getInitialCartSnapshot(),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const persistedCouponState = readPersistedCouponState();
  const [couponCode, setCouponCode] = useState(
    persistedCouponState?.couponCode || "",
  );
  const [couponDiscount, setCouponDiscount] = useState(
    persistedCouponState?.couponDiscount || 0,
  );
  const [couponError, setCouponError] = useState<string | null>(
    persistedCouponState?.couponError || null,
  );
  const [couponOfferType, setCouponOfferType] = useState<string | null>(
    persistedCouponState?.couponOfferType || null,
  );
  const [bogoMessage, setBogoMessage] = useState<string | null>(
    persistedCouponState?.bogoMessage || null,
  );
  const [applicableCategories, setApplicableCategories] = useState<string[]>(
    persistedCouponState?.applicableCategories || [],
  );
  const [itemWiseDiscount, setItemWiseDiscount] = useState<{ [cartItemId: string]: number } | null>(
    persistedCouponState?.itemWiseDiscount || null,
  );
  const [couponMeta, setCouponMeta] = useState<unknown>(
    persistedCouponState?.couponMeta || null,
  );
  const [totalMrp, setTotalMrp] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [autoApplyAttempted, setAutoApplyAttempted] = useState(false);

  useEffect(() => {
    const syncSharedCartToken = () => {
      setSharedCartToken(readSharedCartToken());
    };

    syncSharedCartToken();
    window.addEventListener("popstate", syncSharedCartToken);

    return () => {
      window.removeEventListener("popstate", syncSharedCartToken);
    };
  }, []);

  useEffect(() => {
    if (!couponCode) {
      writePersistedCouponState(null);
      return;
    }

    writePersistedCouponState({
      couponCode,
      couponDiscount,
      couponOfferType,
      couponError: null,
      bogoMessage,
      applicableCategories,
      itemWiseDiscount,
      couponMeta,
    });
  }, [
    couponCode,
    couponDiscount,
    couponOfferType,
    couponError,
    bogoMessage,
    applicableCategories,
    itemWiseDiscount,
    couponMeta,
  ]);

  /**
   * Loads the cart — from the server if authenticated, from localStorage if guest.
   */
  const loadCart = useCallback(async (showLoader: boolean = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      if (sharedCartToken) {
        const sharedResponse = await getSharedCart(sharedCartToken);
        const sharedItems = sharedResponse?.data?.items || [];

        if (sharedResponse?.success && Array.isArray(sharedItems)) {
          setCart(commitCartSnapshot(sharedItems));
          return;
        }

        setError(sharedResponse?.message || "Failed to fetch shared cart");
        setCart(commitCartSnapshot([]));
        return;
      }

      if (isAuthenticated()) {
        // ── Authenticated: fetch from server ──
        const response: CartApiResponse = await fetchCart();
        if (response.success && response.data && Array.isArray(response.data.items)) {
          // Guard: filter out items whose product was deleted (product === null).
          // The backend also strips these, but we defend here in case of timing issues.
          const validItems = response.data.items.filter(
            (item: CartItem) => item.product != null,
          );

          if (validItems.length === 0) {
            const guestItems = readGuestCart();
            if (guestItems.length > 0) {
              setCart(commitCartSnapshot(guestToCartItems(guestItems)));
              void mergeGuestCartOnLogin();
              return;
            }
          }

          setCart(commitCartSnapshot(validItems));
        } else {
          setError("Failed to fetch cart");
        }
      } else {
        // ── Guest: read from localStorage ──
        const guestItems = readGuestCart();
        setCart(commitCartSnapshot(guestToCartItems(guestItems)));
      }
    } catch (error: unknown) {
      console.error("Error loading cart:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching cart",
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [sharedCartToken]);


  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const handleAuthUpdated = () => {
      loadCart(false);
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);

    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    };
  }, [loadCart]);

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCart(false);
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [loadCart]);

  /**
   * Adds a product to the cart.
   * For guests, persists to localStorage with productMeta for display.
   * For authenticated users, calls the API.
   */
  const addToCart = useCallback(
    async (
      productId: string,
      variantId: string,
      quantity: number,
      size: string,
      price: number,
      discountPrice: number,
      variantImage: string,
      color: string,
      productMeta?: { _id: string; name: string; slug: string; mainImage?: { url: string } },
    ) => {
      try {
        if (isAuthenticated()) {
          // ── Authenticated: call API ──
          const response = await addToCartApi(
            productId, variantId, quantity, size, price, discountPrice, color, variantImage,
          );
          if (response.success) {
            await loadCart(false);
            dispatchCartUpdated();
            dispatchCartItemAdded({
              productName: productMeta?.name,
            });
          } else {
            toast.error(response.message || "Failed to add to cart.");
          }
        } else {
          // ── Guest: persist in localStorage ──
          const guestItems = readGuestCart();
          const existingIndex = guestItems.findIndex(
            (g) => g.productId === productId && g.size === size && g.color === color,
          );

          if (existingIndex > -1) {
            guestItems[existingIndex].quantity += quantity;
            guestItems[existingIndex].price = price;
            guestItems[existingIndex].discountPrice = discountPrice;
          } else {
            const newItem: GuestCartItem = {
              _id: `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              productId,
              variantId,
              quantity,
              size,
              color,
              price,
              discountPrice,
              variantImage,
              product: productMeta ?? {
                _id: productId,
                name: "Product",
                slug: "",
                mainImage: variantImage ? { url: variantImage } : undefined,
              },
            };
            guestItems.push(newItem);
          }

          writeGuestCart(guestItems);
          setCart(commitCartSnapshot(guestToCartItems(guestItems)));
          dispatchCartUpdated();
          dispatchCartItemAdded({
            productName: productMeta?.name,
          });
        }
      } catch (error: unknown) {
        console.error("Error adding to cart:", error);
        toast.error("Could not add to cart. Please try again.");
      }
    },
    [loadCart],
  );

  /** Resets all coupon-related state */
  const resetCoupon = useCallback(() => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError(null);
    setCouponOfferType(null);
    setBogoMessage(null);
    setApplicableCategories([]);
    setItemWiseDiscount(null);
    setCouponMeta(null);
    writePersistedCouponState(null);
  }, []);

  /**
   * Removes an item from the cart (server or guest localStorage).
   */
  const removeFromCart = useCallback(
    async (itemId: string, options?: { silent?: boolean }) => {
      try {
        if (isAuthenticated()) {
          const response = await removeFromCartApi(itemId);
          if (response.success) {
            if (!options?.silent) {
              toast.success(response.message || "Item removed from cart!");
            }
            await loadCart(false);
            dispatchCartUpdated();
            resetCoupon();
          } else {
            toast.error(response.message || "Failed to remove item from cart.");
          }
        } else {
          // Guest: remove from localStorage
          const guestItems = readGuestCart().filter((g) => g._id !== itemId);
          writeGuestCart(guestItems);
          setCart(commitCartSnapshot(guestToCartItems(guestItems)));
          dispatchCartUpdated();
          if (!options?.silent) {
            toast.success("Item removed from cart!");
          }
          resetCoupon();
        }
      } catch (error: unknown) {
        console.error("Error removing from cart:", error);
        toast.error("Could not remove item from cart. Please try again.");
      }
    },
    [loadCart, resetCoupon],
  );

  const moveFromCartToWishlist = useCallback(
    async (
      itemId: string,
      productId: string,
      options?: { silent?: boolean },
    ) => {
      try {
        const removeResponse = await removeFromCartApi(itemId);
        if (removeResponse.success) {
          await loadCart(false);
          dispatchCartUpdated();
          resetCoupon();

          const wishlistResponse = await toggleWishlistApi(productId);
          if (wishlistResponse.success) {
            dispatchWishlistUpdated();
            if (!options?.silent) {
              toast.success("Item moved to wishlist!");
            }
          } else {
            toast.error(wishlistResponse.message || "Failed to add to wishlist.");
          }
        } else {
          toast.error(removeResponse.message || "Failed to remove item from cart.");
        }
      } catch (error: unknown) {
        console.error("Error moving to wishlist:", error);
        toast.error("Could not move item to wishlist. Please try again.");
      }
    },
    [loadCart, resetCoupon],
  );

  // Calculate totals whenever cart or coupon changes
  useEffect(() => {
    let newTotalMrp = 0;
    let newTotalDiscount = 0;

    cart.forEach((item) => {
      const itemPrice = item.price ?? 0;
      const itemDiscountPrice = item.discountPrice ?? itemPrice;
      newTotalMrp += itemPrice * item.quantity;
      newTotalDiscount += (itemPrice - itemDiscountPrice) * item.quantity;
    });

    setTotalMrp(newTotalMrp);
    setTotalDiscount(newTotalDiscount);
    setFinalAmount(newTotalMrp - newTotalDiscount - couponDiscount);
  }, [cart, couponDiscount]);

  const applyCoupon = useCallback(
    async (
      code: string,
      userId: string,
      couponMeta?: UseCartReturn["couponMeta"],
      options?: { silent?: boolean },
    ): Promise<boolean> => {
      const normalizedCode = normalizeCouponCode(code);
      if (!normalizedCode) {
        if (!options?.silent) {
          setCouponError("Please enter a coupon code.");
        }
        if (!options?.silent) {
          toast.error("Please enter a coupon code.");
        }
        return false;
      }

      if (
        couponMeta &&
        isSingleUseCoupon(couponMeta) &&
        hasRedeemedCoupon(userId, normalizedCode)
      ) {
        const message = "You have already used this coupon.";
        if (!options?.silent) {
          setCouponError(message);
        }
        if (!options?.silent) {
          toast.error(message);
        }
        return false;
      }

      setCouponError(null);
      setBogoMessage(null);
      setCouponOfferType(null);
      setApplicableCategories([]);
      setItemWiseDiscount(null);
      setCouponMeta(null);

      try {
        let currentMrp = 0;
        let currentDiscount = 0;

        cart.forEach((item) => {
          const itemPrice = item.price ?? 0;
          const itemDiscountPrice = item.discountPrice ?? itemPrice;
          currentMrp += itemPrice * item.quantity;
          currentDiscount += (itemPrice - itemDiscountPrice) * item.quantity;
        });

        const currentFinalAmount = currentMrp - currentDiscount;

        const response = await applyCouponApi(
          normalizedCode,
          currentFinalAmount,
          userId,
          cart,
        );

        if (response.success) {
          const appliedCouponCode = normalizeCouponCode(
            response.data.couponCode || normalizedCode,
          );
          const discountAmount = response.data.discount ?? 0;
          const responseMeta = response.data as Record<string, unknown>;
          setCouponCode(appliedCouponCode);
          setCouponOfferType(response.data.offerType);
          setCouponMeta(responseMeta);

          if (response.data.applicableIds && response.data.applicableIds.length > 0) {
            setApplicableCategories(response.data.applicableIds);
          }

          setItemWiseDiscount(response.data.itemWiseDiscount || {});
          setCouponDiscount(discountAmount);

          if (isSingleUseCoupon(couponMeta) || isSingleUseCoupon(responseMeta)) {
            markCouponRedeemed(userId, appliedCouponCode);
          }

          if (response.data.offerType === "BOGO") {
            setBogoMessage(`Congrats! Your BOGO offer has been applied. You saved ₹${discountAmount.toFixed(2)}!`);
          } else if (response.data.offerType === "FixedAmount") {
            setBogoMessage(`₹${discountAmount.toFixed(2)} flat discount applied!`);
          }

          if (!options?.silent) {
            toast.success("Coupon applied successfully!");
          }
          return true;
        } else {
          if (!options?.silent) {
            setCouponError(response.message || "Invalid coupon code.");
          }
          setCouponMeta(null);
          if (!options?.silent) {
            toast.error(response.message || "Invalid coupon code.");
          }
          return false;
        }
      } catch (error: unknown) {
        console.error("Error applying coupon:", error);
        if (!options?.silent) {
          setCouponError("Could not apply coupon. Please try again.");
        }
        setCouponMeta(null);
        if (!options?.silent) {
          toast.error("Could not apply coupon. Please try again.");
        }
        return false;
      }
    },
    [cart],
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      setAutoApplyAttempted(false);
      return;
    }

    if (sharedCartToken) {
      return;
    }

    if (couponCode || cart.length === 0 || loading || autoApplyAttempted) {
      return;
    }

    const token = getToken();
    const user = getUserDetails();
    const userId = user?.id;

    if (!token || !userId) {
      return;
    }

    let cancelled = false;

    const tryAutoApplyFestiveCoupon = async () => {
      try {
        const response = await getAllCouponsClient(token, {
          page: 1,
          limit: 100,
        });
        const couponList = response?.data?.data || response?.data || [];

        if (!Array.isArray(couponList)) {
          setAutoApplyAttempted(true);
          return;
        }

        const festiveAutoCoupons = couponList.filter(
          (coupon: CouponCandidate) =>
            coupon?.couponType === "FestiveSale" &&
            (coupon.isAutomatic === true || coupon.code?.startsWith("AUTO-")),
        );

        if (festiveAutoCoupons.length === 0) {
          setAutoApplyAttempted(true);
          return;
        }

        for (const couponToApply of festiveAutoCoupons) {
          const couponCodeToApply = couponToApply?.code
            ? normalizeCouponCode(couponToApply.code)
            : "";

          if (!couponCodeToApply || cancelled) {
            continue;
          }

          const applied = await applyCoupon(couponCodeToApply, userId, couponToApply, {
            silent: true,
          });

          if (applied || cancelled) {
            return;
          }
        }
      } catch (error) {
        console.error("Error auto-applying festive coupon:", error);
      } finally {
        if (!cancelled) {
          setAutoApplyAttempted(true);
        }
      }
    };

    void tryAutoApplyFestiveCoupon();

    return () => {
      cancelled = true;
    };
  }, [applyCoupon, autoApplyAttempted, cart, couponCode, loading, sharedCartToken]);

  useEffect(() => {
    if (couponCode) {
      setAutoApplyAttempted(true);
      return;
    }

    setAutoApplyAttempted(false);
  }, [couponCode, cart]);

  /**
   * Updates the quantity of a cart item.
   */
  const updateCartItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        if (isAuthenticated()) {
          const response = await updateCartItemQuantityApi(itemId, quantity);
          if (response.success) {
            setCart((prevCart) => {
              const nextCart =
                quantity <= 0
                  ? prevCart.filter((item) => item._id !== itemId)
                  : prevCart.map((item) =>
                      item._id === itemId ? { ...item, quantity } : item,
                    );
              cachedCartSnapshot = nextCart;
              return nextCart;
            });
            dispatchCartUpdated();
            resetCoupon();
          } else {
            toast.error(response.message || "Failed to update quantity.");
          }
        } else {
          // Guest: update in localStorage
          const guestItems = readGuestCart().map((g) => {
            if (g._id !== itemId) return g;
            return { ...g, quantity };
          }).filter((g) => g.quantity > 0);
          writeGuestCart(guestItems);
          setCart(commitCartSnapshot(guestToCartItems(guestItems)));
          dispatchCartUpdated();
          resetCoupon();
        }
      } catch (error: unknown) {
        console.error("Error updating cart quantity:", error);
        toast.error("Could not update quantity. Please try again.");
      }
    },
    [resetCoupon],
  );

  const removeCoupon = useCallback((options?: { silent?: boolean }) => {
    resetCoupon();
    if (!options?.silent) {
      toast.success("Coupon removed");
    }
  }, [resetCoupon]);

  const clearCart = useCallback(async (userId: string) => {
    try {
      if (isAuthenticated()) {
        if (!userId) {
          toast.error("User ID is required to clear cart");
          return;
        }
        const response = await clearCartApi(userId);
        if (response && response.success) {
          setCart(commitCartSnapshot([]));
          setTotalMrp(0);
          setTotalDiscount(0);
          setFinalAmount(0);
          dispatchCartUpdated();
          removeCoupon();
          toast.success("Cart cleared successfully");
        } else {
          toast.error(response?.message || "Failed to clear cart");
        }
      } else {
        clearGuestCart();
        setCart(commitCartSnapshot([]));
        setTotalMrp(0);
        setTotalDiscount(0);
        setFinalAmount(0);
        dispatchCartUpdated();
        removeCoupon();
        toast.success("Cart cleared");
      }
    } catch (error: unknown) {
      console.error("Error clearing cart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clear cart",
      );
    }
  }, [removeCoupon]);

  return {
    cart,
    loading,
    error,
    couponCode,
    couponDiscount,
    couponError,
    couponOfferType,
    bogoMessage,
    applicableCategories,
    itemWiseDiscount,
    couponMeta,
    totalMrp,
    totalDiscount,
    finalAmount,
    addToCart,
    removeFromCart,
    moveFromCartToWishlist,
    applyCoupon,
    updateCartItemQuantity,
    removeCoupon,
    clearCart,
  };
};
