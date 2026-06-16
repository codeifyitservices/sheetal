"use client";
import React, { useState } from "react";
import { useWishlist } from "../../hooks/useWishlist";
import WishlistItemCard from "./WishlistItemCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { addToCart as addToCartApi } from "../../services/cartService";
import { getApiImageUrl } from "../../services/api";
import {
  Product,
  toggleWishlist as toggleWishlistApi,
} from "../../services/productService";
import { isAuthenticated } from "../../services/authService";
import {
  dispatchCartUpdated,
  dispatchWishlistUpdated,
} from "../../hooks/shopEvents";

const WishlistContent = () => {
  const { wishlist, loading, toggleProductInWishlist } = useWishlist();
  const router = useRouter();
  const [movingToCart, setMovingToCart] = useState<string | null>(null);

  // We use a local state to optimistically hide moved items from the wishlist
  const [optimisticRemovedIds, setOptimisticRemovedIds] = useState<Set<string>>(new Set());

  const handleMoveToCart = async (product: Product) => {
    if (movingToCart) return;

    if (!isAuthenticated()) {
      sessionStorage.setItem("redirect", window.location.pathname);
      router.push("/login");
      return;
    }

    const selectedVariant = product.variants.find((variant) =>
      variant.sizes?.some((size) => size.stock > 0),
    );
    const selectedSize = selectedVariant?.sizes.find((size) => size.stock > 0);

    if (!selectedVariant || !selectedSize) {
      toast.error("This item is currently unavailable.");
      return;
    }

    const variantImage = getApiImageUrl(
      selectedVariant.v_image,
      product.mainImage?.url || "/assets/placeholder-product.jpg",
    );

    // Snapshot for potential rollback
    const productId = product._id;
    
    try {
      setMovingToCart(productId);
      
      // Optimistically hide from wishlist
      setOptimisticRemovedIds(prev => new Set(prev).add(productId));

      const cartResponse = await addToCartApi(
        productId,
        selectedVariant._id,
        1,
        selectedSize.name,
        selectedSize.price || 0,
        selectedSize.discountPrice || selectedSize.price || 0,
        selectedVariant.color?.name || "",
        variantImage,
      );

      if (!cartResponse.success) {
        // Rollback on cart failure
        setOptimisticRemovedIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.error(cartResponse.message || "Failed to move item to cart.");
        return;
      }

      // Sync backend wishlist (remove item)
      // We don't wait for this to update UI since we already hid it optimistically
      void toggleWishlistApi(productId).then((wishlistResponse) => {
         if (wishlistResponse.success) {
            dispatchWishlistUpdated();
         } else {
            console.error("Failed to remove from wishlist after cart add:", wishlistResponse.message);
         }
      });

      dispatchCartUpdated();
      toast.success("Item moved to cart!");
    } catch (error) {
      // Rollback on network failure
      setOptimisticRemovedIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      console.error("Failed to move wishlist item to cart:", error);
      toast.error("Could not move item to cart. Please try again.");
    } finally {
      setMovingToCart(null);
    }
  };

  const processedWishlist = wishlist
    .filter(p => !optimisticRemovedIds.has(p._id))
    .map((p) => {
    let lowestPrice = Infinity;
    let lowestMrp = Infinity;

    p.variants?.forEach((variant) => {
      variant.sizes?.forEach((size) => {
        const currentPrice =
          size.discountPrice && size.discountPrice > 0
            ? size.discountPrice
            : size.price;
        if (currentPrice < lowestPrice) {
          lowestPrice = currentPrice;
          lowestMrp = size.price;
        }
      });
    });

    if (lowestPrice === Infinity) {
      lowestPrice = 0;
      lowestMrp = 0;
    }

    const discountPercent =
      lowestMrp > 0 && lowestPrice < lowestMrp
        ? Math.round(((lowestMrp - lowestPrice) / lowestMrp) * 100)
        : 0;

    return {
      ...p,
      lowestPrice,
      lowestMrp,
      discountPercent,
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#bd9951] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="text-center min-h-[50vh] flex flex-col justify-center items-center my-50">
        <h4 className="text-2xl font-medium mb-4">Your Wishlist is Empty</h4>
        <p className="text-gray-600 mb-6">
          Looks like you haven't added anything to your wishlist yet.
        </p>
        <Link
          href="/product-list"
          className="inline-block bg-[#6b4a1f] text-white py-3 px-8 text-md tracking-wide hover:bg-opacity-90 transition cursor-pointer"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 mt-15">
      <div className="text-center mb-8">
        <h4 className="text-[24px] tracking-wide font-medium font-[family-name:var(--font-montserrat)] text-[#70480c]">
          My Wishlist{" "}
          <span className="font-light text-[15px]">
            ({wishlist.length} items)
          </span>{" "}
        </h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {processedWishlist.map((product) => (
          <WishlistItemCard
            key={product._id}
            product={product}
            onRemove={toggleProductInWishlist}
            onMoveToCart={handleMoveToCart}
            isMovingToCart={movingToCart === product._id}
          />
        ))}
      </div>
    </div>
  );
};

export default WishlistContent;
