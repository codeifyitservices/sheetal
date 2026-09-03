"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchWishlist,
  toggleWishlist as toggleWishlistApi,
  Product,
} from "../services/productService";
import {
  isAuthenticated,
  logout,
  isTokenExpired,
  isAuthExpiredError,
} from "../services/authService";
import {
  dispatchWishlistUpdated,
  WISHLIST_UPDATED_EVENT,
} from "./shopEvents";
import {
  consumeRedirectModalState,
  redirectToLogin,
} from "../utils/authRedirect";

export interface UseWishlistReturn {
  wishlist: Product[];
  loading: boolean;
  error: string | null;
  toggleProductInWishlist: (productId: string) => Promise<void>;
  isProductInWishlist: (productId: string) => boolean;
  isLoginModalOpen: boolean;
  closeLoginModal: () => void;
  handleLoginRedirect: () => void;
}

type ErrorLike = {
  response?: { status?: number };
  status?: number;
  message?: string;
  unauthorized?: boolean;
};

/** Detects 401-style errors from axios, fetch, or plain Error messages */
const isUnauthorized = (err: ErrorLike): boolean =>
  err?.unauthorized === true ||
  err?.response?.status === 401 ||
  err?.status === 401 ||
  isAuthExpiredError(err?.message, err?.status || err?.response?.status);

let cachedWishlistSnapshot: Product[] | null = null;

const getInitialWishlistSnapshot = (): Product[] =>
  cachedWishlistSnapshot ?? [];

const commitWishlistSnapshot = (items: Product[]): Product[] => {
  cachedWishlistSnapshot = items;
  return items;
};

export const useWishlist = (): UseWishlistReturn => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Product[]>(() => getInitialWishlistSnapshot());
  const [optimisticWishlistIds, setOptimisticWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync optimistic set with actual wishlist whenever it changes
  useEffect(() => {
    setOptimisticWishlistIds(new Set(wishlist.map((p) => p._id)));
  }, [wishlist]);

  const loadWishlist = useCallback(async (showLoader: boolean = true) => {
    if (!isAuthenticated()) {
      setWishlist(commitWishlistSnapshot([]));
      if (showLoader) {
        setLoading(false);
      }
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetchWishlist();
      if (response.success && Array.isArray(response.data)) {
        setWishlist(commitWishlistSnapshot(response.data));
      } else {
        setWishlist(commitWishlistSnapshot([]));
      }
    } catch (err: unknown) {
      const error = err as ErrorLike;
      if (isUnauthorized(error)) {
        setWishlist(commitWishlistSnapshot([]));
      } else {
        console.error("Error loading wishlist:", err);
        setError(error.message || "An error occurred while fetching wishlist");
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggleProductInWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated()) {
        logout();
        redirectToLogin(router);
        return;
      }

      const isCurrentlyInWishlist = optimisticWishlistIds.has(productId);

      // 1. Optimistically update set
      setOptimisticWishlistIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyInWishlist) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        const response = await toggleWishlistApi(productId);
        if (response.success) {
          // Sync with server state
          await loadWishlist(false);
          dispatchWishlistUpdated();
          toast.success(response.message || "Wishlist updated!");
        } else {
          // Rollback on logic error
          setOptimisticWishlistIds((prev) => {
            const next = new Set(prev);
            if (isCurrentlyInWishlist) next.add(productId);
            else next.delete(productId);
            return next;
          });

          if (isUnauthorized(response as ErrorLike)) {
            logout();
            redirectToLogin(router);
            return;
          }
          toast.error(response.message || "Failed to update wishlist.");
        }
      } catch (err: unknown) {
        // Rollback on network error
        setOptimisticWishlistIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyInWishlist) next.add(productId);
          else next.delete(productId);
          return next;
        });

        const error = err as ErrorLike;
        if (isUnauthorized(error)) {
          logout();
          redirectToLogin(router);
          return;
        }
        toast.error("Could not update wishlist. Please try again.");
      }
    },
    [optimisticWishlistIds, loadWishlist],
  );

  const isProductInWishlist = useCallback(
    (productId: string) => optimisticWishlistIds.has(productId),
    [optimisticWishlistIds],
  );

  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const handleLoginRedirect = useCallback(() => {
    setIsLoginModalOpen(false);
    if (typeof window !== "undefined") {
      redirectToLogin(router, undefined, {
        modals: {
          wishlistLoginModalOpen: true,
        },
      });
    }
  }, [router]);

  return {
    wishlist,
    loading,
    error,
    toggleProductInWishlist,
    isProductInWishlist,
    isLoginModalOpen,
    closeLoginModal,
    handleLoginRedirect,
  };
};
