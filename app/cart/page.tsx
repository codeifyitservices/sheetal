"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart, CartItem } from "../hooks/useCart";
import CartItemsList from "./components/CartItemsList";
import PriceDetails from "./components/PriceDetails";
import { getSettings } from "../services/settingsService";
import { isAuthenticated } from "../services/authService";
import { peekRedirectField, redirectToLogin } from "../utils/authRedirect";
import { createSharedCart } from "../services/cartService";
import { useSettings } from "../hooks/useSettings";
import { getLogoUrl } from "../services/settingsService";
import Footer from "../components/Footer";
import HideStorefrontHeader from "../components/HideStorefrontHeader";

const readSharedCartToken = (): string => {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search)
    .get("sharedCartToken")
    ?.trim() || "";
};

const CartPage = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const logoUrl = getLogoUrl(settings);
  const [sharedCartToken, setSharedCartToken] = useState(readSharedCartToken);
  const {
    cart: cartItems,
    loading,
    removeFromCart,
    moveFromCartToWishlist,
    couponCode,
    couponDiscount,
    couponError,
    couponMeta,
    totalMrp,
    totalDiscount,
    finalAmount,
    applyCoupon,
    bogoMessage,
    applicableCategories,
    itemWiseDiscount,
    updateCartItemQuantity,
    removeCoupon,
  } = useCart();

  /* Settings State */
  const [platformFee, setPlatformFee] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [baseShippingFee, setBaseShippingFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  /* Selection State */
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [modalAction, setModalAction] = useState<"remove" | "wishlist">(
    "remove",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState(
    () => peekRedirectField<string>("couponInput") || couponCode || "",
  );

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

  /* Selection Handlers */
  const handleSelectionChange = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleBulkRemove = () => {
    if (selectedItemIds.length === 0) {
      toast.error("Please select items to remove.");
      return;
    }
    setIsBulkAction(true);
    setModalAction("remove");
    setIsModalOpen(true);
  };

  const handleBulkHeart = () => {
    if (selectedItemIds.length === 0) {
      toast.error("Please select items to remove.");
      return;
    }
    setIsBulkAction(true);
    setModalAction("wishlist");
    setIsModalOpen(true);
  };

  const handleRemoveItem = (item: CartItem) => {
    setIsBulkAction(false);
    setModalAction("remove");
    setItemToRemove(item);
    setIsModalOpen(true);
  };

  const handleMoveToWishlistAction = (item: CartItem) => {
    setIsBulkAction(false);
    setModalAction("wishlist");
    setItemToRemove(item);
    setIsModalOpen(true);
  };

  const confirmRemoveItem = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isBulkAction) {
        for (const id of selectedItemIds) {
          await removeFromCart(id, { silent: true });
        }
        toast.success(
          `${selectedItemIds.length} item${selectedItemIds.length > 1 ? "s" : ""} removed from cart!`,
        );
        setSelectedItemIds([]);
      } else if (itemToRemove) {
        await removeFromCart(itemToRemove._id);
        setItemToRemove(null);
      }
      setIsModalOpen(false);
      setIsBulkAction(false);
      setModalAction("remove");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveToWishlist = async () => {
    if (isProcessing) return;

    if (!isAuthenticated()) {
      redirectToLogin(router, "/cart");
      return;
    }

    setIsProcessing(true);
    try {
      if (isBulkAction) {
        for (const id of selectedItemIds) {
          const item = cartItems.find((i) => i._id === id);
          if (item) {
            await moveFromCartToWishlist(id, item.product._id, {
              silent: true,
            });
          }
        }
        toast.success(
          `${selectedItemIds.length} item${selectedItemIds.length > 1 ? "s" : ""} moved to wishlist!`,
        );
        setSelectedItemIds([]);
      } else if (itemToRemove) {
        await moveFromCartToWishlist(
          itemToRemove._id,
          itemToRemove.product._id,
        );
        setItemToRemove(null);
      }
      setIsModalOpen(false);
      setIsBulkAction(false);
      setModalAction("remove");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRemoveItem = () => {
    setIsModalOpen(false);
    setItemToRemove(null);
    setIsBulkAction(false);
    setModalAction("remove");
  };

  const handleApplyCoupon = (
    userId: string | undefined,
    couponMeta?: unknown,
  ) => {
    if (!userId && !isAuthenticated()) {
      toast.error("Please login to apply coupons.");
      return;
    }
    
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    if (!userId) {
      toast.error("User session issue. Please try logging in again if this persists.");
      return;
    }

    applyCoupon(couponInput.trim().toUpperCase(), userId, couponMeta || undefined);
  };

  const handleShareCart = async (): Promise<string | null> => {
    if (cartItems.length === 0) {
      toast.error("Add items to your cart before sharing.");
      return null;
    }

    try {
      const response = await createSharedCart(cartItems);

      if (!response?.success || !response?.data?.token) {
        toast.error(response?.message || "Could not create share link.");
        return null;
      }

      return `${window.location.origin}/shared-cart/${response.data.token}`;
    } catch (error) {
      console.error("Failed to share cart:", error);
      toast.error("Could not create share link.");
      return null;
    }
  };

  const handleProceedToBuy = () => {
    const checkoutTarget = sharedCartToken
      ? `/checkout/address?sharedCartToken=${encodeURIComponent(sharedCartToken)}`
      : "/checkout/address";

    if (!isAuthenticated()) {
      redirectToLogin(router, checkoutTarget, {
        cartSnapshot: cartItems,
      });
      return;
    }
    router.push(checkoutTarget);
  };

  /* Fetch Settings Once */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettings();
        setPlatformFee(Number(settings.platformFee) || 0);
        setBaseShippingFee(Number(settings.shippingFee) || 0);
        setFreeShippingThreshold(Number(settings.freeShippingThreshold) || 0);

        const threshold = Number(settings.freeShippingThreshold) || 0;
        if (finalAmount > threshold && threshold > 0) {
          setShippingCharges(0);
        } else {
          setShippingCharges(Number(settings.shippingFee) || 0);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, [finalAmount]);

  /* Recalculate Shipping on Amount Change */
  useEffect(() => {
    if (finalAmount > freeShippingThreshold && freeShippingThreshold > 0) {
      setShippingCharges(0);
    } else {
      setShippingCharges(baseShippingFee);
    }
  }, [finalAmount, freeShippingThreshold, baseShippingFee]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#bd9951] rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalAmount = finalAmount + shippingCharges + platformFee;

  const categoryNames =
    applicableCategories.length > 0
      ? cartItems
          .filter(
            (item) =>
              item.product.category &&
              applicableCategories.includes(item.product.category._id),
          )
          .map((item) => item.product.category.name)
      : [];
  const uniqueCategoryNames = Array.from(new Set(categoryNames));
  const displayCategoryName =
    uniqueCategoryNames.length > 0 ? uniqueCategoryNames.join(", ") : null;

  return (
    <div className="font-montserrat">
      <HideStorefrontHeader />
      {/* Header */}
      <div className="w-full">
        <div className="flex justify-between items-center py-8 px-6 md:px-10">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src={logoUrl}
                alt="Studio By Sheetal"
                width={40}
                height={40}
              />
            </Link>
          </div>

          {/* Checkout Steps */}
          <div className="hidden md:flex items-center text-[15px] space-x-2 font-[family-name:var(--font-montserrat)]">
            <div className="text-[#0d9842] font-medium ">BAG</div>
            <div className="text-[#bd9951]">----------</div>
            <Link
              href="/checkout/address"
              className="text-black font-medium hover:text-[#bd9951]"
            >
              ADDRESS
            </Link>
            <div className="text-[#bd9951]">----------</div>
            <div className="textblack cursor-not-allowed font-medium">PAYMENT</div>
          </div>

          {/* Secure Badge */}
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <Image
              src="/assets/icons/shield.svg"
              alt="Secure"
              width={30}
              height={30}
            />
            <span>100% SECURE</span>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="container mx-auto py-8 px-4 md:px-8 lg:px-12">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl font-semibold text-gray-700 mb-4">
              Your cart is empty!
            </p>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-[#6a3f07] text-white rounded-md font-bold hover:bg-[#5a2f00] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
              <CartItemsList
                cartItems={cartItems}
                applicableCategories={applicableCategories}
                itemWiseDiscount={itemWiseDiscount}
                moveFromCartToWishlist={moveFromCartToWishlist}
                updateCartItemQuantity={updateCartItemQuantity}
                onShareCart={handleShareCart}
                handleRemoveItem={handleRemoveItem}
                handleMoveToWishlistAction={handleMoveToWishlistAction}
                isModalOpen={isModalOpen}
                confirmRemoveItem={confirmRemoveItem}
                cancelRemoveItem={cancelRemoveItem}
                handleMoveToWishlist={handleMoveToWishlist}
                cartLength={cartItems.length}
                selectedItemIds={selectedItemIds}
                onSelectionChange={handleSelectionChange}
                onBulkRemove={handleBulkRemove}
                isBulkAction={isBulkAction}
                onBulkHeart={handleBulkHeart}
                modalAction={modalAction}
              />

              <div className="w-full lg:w-4/12">
                <PriceDetails
                  couponInput={couponInput}
                  setCouponInput={setCouponInput}
                  handleApplyCoupon={handleApplyCoupon}
                  couponError={couponError}
                  bogoMessage={bogoMessage}
                  applicableCategories={applicableCategories}
                  categoryName={displayCategoryName}
                  couponCode={couponCode}
                  couponMeta={couponMeta}
                  onRemoveCoupon={removeCoupon}
                  cartLength={cartItems.length}
                  totalMrp={totalMrp}
                  totalDiscount={totalDiscount}
                  couponDiscount={couponDiscount}
                  shippingCharges={shippingCharges}
                  platformFee={platformFee}
                  totalAmount={totalAmount}
                  onProceed={handleProceedToBuy}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-around items-center mt-12 py-4 gap-y-6">
              {[
                {
                  src: "/assets/icons/secure-payment.svg",
                  alt: "Secure Payments",
                  label: "Secure Payments",
                },
                {
                  src: "/assets/icons/transaction.svg",
                  alt: "Cash on delivery",
                  label: "Cash on delivery",
                },
                {
                  src: "/assets/icons/quality-assurance.svg",
                  alt: "Assured Quality",
                  label: "Assured Quality",
                },
                {
                  src: "/assets/icons/product-return1.svg",
                  alt: "Easy returns",
                  label: "Easy returns",
                },
              ].map(({ src, alt, label }) => (
                <div
                  key={label}
                  className="flex items-center text-sm w-1/2 md:w-auto justify-center px-2"
                >
                  <Image src={src} alt={alt} width={30} height={30} />
                  <span className="ml-2 text-sm md:text-xl text-[#706a42] font-semibold whitespace-nowrap">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default CartPage;
