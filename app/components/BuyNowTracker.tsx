"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "../hooks/useCart";
import toast from "react-hot-toast";

export default function BuyNowTracker() {
  const pathname = usePathname();
  const { addToCart } = useCart();
  const lastPathnameRef = useRef(pathname);

  useEffect(() => {
    const handleNavigationChange = async () => {
      const prevPath = lastPathnameRef.current;
      const currentPath = pathname;
      lastPathnameRef.current = currentPath;

      if (typeof window === "undefined") return;

      const buyNowStr = sessionStorage.getItem("buy_now_item");
      if (!buyNowStr) return;

      // The Buy Now flow is active on "/cart" and "/checkout" (except success page)
      const isCheckoutOrCart = (path: string) => {
        return (
          path === "/cart" ||
          (path.startsWith("/checkout") && path !== "/checkout/success")
        );
      };

      const wasInFlow = isCheckoutOrCart(prevPath);
      const isInFlow = isCheckoutOrCart(currentPath);

      if (currentPath === "/checkout/success") {
        // Checkout completed successfully: clear the buy now flow
        sessionStorage.removeItem("buy_now_item");
      } else if (wasInFlow && !isInFlow) {
        // Left the flow (cancelled / went back to other pages): add to cart permanently
        try {
          const buyNowObj = JSON.parse(buyNowStr);
          await addToCart(
            buyNowObj.product._id,
            buyNowObj.variantId,
            buyNowObj.quantity,
            buyNowObj.size,
            buyNowObj.price,
            buyNowObj.discountPrice,
            buyNowObj.variantImage,
            buyNowObj.color,
            buyNowObj.product,
            99999 // high fallback to pass client stock validation check
          );
          toast.success(`${buyNowObj.product.name} added to cart.`);
        } catch (e) {
          console.error("Error auto-adding buy now item to cart:", e);
        } finally {
          sessionStorage.removeItem("buy_now_item");
        }
      }
    };

    void handleNavigationChange();
  }, [pathname, addToCart]);

  return null;
}
