"use client";
import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AddressList, { Address } from "../components/AddressList";
import AddressForm from "../components/AddressForm";
import MiniCartSummary from "../components/MiniCartSummary";
import PriceDetails from "../../cart/components/PriceDetails";
import { useCart } from "../../hooks/useCart";
import {
  applyCoupon as applyCouponApi,
  recordCartActivity,
} from "../../services/cartService";
import { getCurrentUser } from "../../services/userService";
import { getSettings } from "../../services/settingsService";
import toast from "react-hot-toast";
import { createRazorpayPaymentLink } from "../../services/paymentService";
import { createCODOrder } from "../../services/orderService";
import { useSearchParams } from "next/navigation";
import { peekRedirectField, redirectToLogin } from "../../utils/authRedirect";
import { getUserDetails, isAuthenticated } from "../../services/authService";
import { useSettings } from "../../hooks/useSettings";
import { getLogoUrl } from "../../services/settingsService";
import { hasRedeemedCoupon, isSingleUseCoupon, markCouponRedeemed } from "../../utils/couponRedemption";
import type { CartItem } from "../../hooks/useCart";
import HideStorefrontHeader from "../../components/HideStorefrontHeader";

// ── Inner component that uses useSearchParams ─────────────────────────────
const AddressPageInner = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const logoUrl = getLogoUrl(settings);
  const {
    cart,
    totalMrp,
    totalDiscount,
    couponDiscount,
    finalAmount,
    loading,
    couponCode,
    couponMeta,
    applyCoupon,
    removeCoupon,
    couponError,
    bogoMessage,
    applicableCategories,
  } = useCart();
  const cartSnapshot = peekRedirectField<CartItem[]>("cartSnapshot") || [];
  const searchParams = useSearchParams();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isEmailFromProfile, setIsEmailFromProfile] = useState(false);
  const [couponInput, setCouponInput] = useState(
    () =>
      couponCode ||
      searchParams.get("couponCode") ||
      searchParams.get("couponInput") ||
      peekRedirectField<string>("couponInput") ||
      "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedShippingAddressIdRef = useRef<string | null>(null);
  const selectedBillingAddressIdRef = useRef<string | null>(null);
  const [buyNowCouponCode, setBuyNowCouponCode] = useState("");
  const [buyNowCouponDiscount, setBuyNowCouponDiscount] = useState(0);
  const [buyNowCouponError, setBuyNowCouponError] = useState<string | null>(null);
  const [buyNowBogoMessage, setBuyNowBogoMessage] = useState<string | null>(null);
  const [buyNowApplicableCategories, setBuyNowApplicableCategories] = useState<string[]>([]);
  const autoRecoveryCouponAppliedRef = useRef<string | null>(null);

  const [platformFee, setPlatformFee] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [baseShippingFee, setBaseShippingFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  // ── Buy Now param ─────────────────────────────────────────────────────────
  const recoverySource = searchParams.get("recoverySource")?.trim();
  const recoveryStageValue = searchParams.get("recoveryStage");
  const recoveryCartId = searchParams.get("cartId")?.trim();
  const recoveryCycleId = searchParams.get("recoveryCycleId")?.trim();
  const recoveryCouponCode = (
    searchParams.get("couponCode") ||
    searchParams.get("couponInput") ||
    peekRedirectField<string>("couponInput") ||
    ""
  )
    .trim()
    .toUpperCase() || null;

  const recoveryAttribution =
    recoverySource &&
    recoveryStageValue &&
    ["email", "whatsapp", "sms"].includes(recoverySource)
      ? (() => {
          const recoveryStage = Number(recoveryStageValue);
          if (!Number.isFinite(recoveryStage) || recoveryStage < 1) {
            return null;
          }

          return {
            recoverySource,
            recoveryStage,
            ...(recoveryCartId ? { recoveryCartId } : {}),
            ...(recoveryCycleId ? { recoveryCycleId } : {}),
          };
        })()
      : null;

  const buyNowItem = (() => {
    const param = searchParams.get("buynow");
    if (!param) return null;
    try {
      return JSON.parse(decodeURIComponent(param));
    } catch {
      return null;
    }
  })();

  const normalizeQuantity = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
  };

  const isBuyNow = !!buyNowItem;
  const activeItems = isBuyNow
    ? [buyNowItem]
    : cart.length > 0
      ? cart
      : cartSnapshot;
  const normalizedActiveItems = activeItems.map((item) => ({
    ...item,
    quantity: normalizeQuantity(item.quantity),
  }));

  const activeTotalMrp = isBuyNow
    ? normalizedActiveItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : totalMrp;

  const activeTotalDiscount = isBuyNow
    ? normalizedActiveItems.reduce(
        (sum, i) => sum + (i.price - (i.discountPrice || i.price)) * i.quantity,
        0,
      )
    : totalDiscount;

  const grossItemsTotal = isBuyNow
    ? normalizedActiveItems.reduce(
        (sum, i) => sum + (i.discountPrice || i.price) * i.quantity,
        0,
      )
    : totalMrp - totalDiscount;

  const effectiveCouponCode = isBuyNow ? buyNowCouponCode : couponCode;
  const effectiveCouponDiscount = isBuyNow
    ? buyNowCouponDiscount
    : couponDiscount;
  const effectiveCouponError = isBuyNow ? buyNowCouponError : couponError;
  const effectiveBogoMessage = isBuyNow ? buyNowBogoMessage : bogoMessage;
  const effectiveApplicableCategories = isBuyNow
    ? buyNowApplicableCategories
    : applicableCategories;

  const netItemsTotal = Math.max(0, grossItemsTotal - effectiveCouponDiscount);
  const totalAmount = netItemsTotal + shippingCharges + platformFee;

  useEffect(() => {
    if (!isBuyNow) {
      return;
    }

    setCouponInput(peekRedirectField<string>("couponInput") || "");
  }, [isBuyNow]);

  useEffect(() => {
    if (recoveryCouponCode && couponInput !== recoveryCouponCode) {
      setCouponInput(recoveryCouponCode);
    }
  }, [couponInput, recoveryCouponCode]);
  useEffect(() => {
    if (isBuyNow || cart.length === 0 || recoveryCouponCode) {
      return;
    }

    void recordCartActivity({ source: "checkout_address" }).catch((error) => {
      console.error("Failed to record cart activity", error);
    });
  }, [cart.length, isBuyNow]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    selectedShippingAddressIdRef.current = selectedShippingAddressId;
  }, [selectedShippingAddressId]);

  useEffect(() => {
    selectedBillingAddressIdRef.current = selectedBillingAddressId;
  }, [selectedBillingAddressId]);

  useEffect(() => {
    if (billingSameAsShipping) {
      setSelectedBillingAddressId(selectedShippingAddressId);
    }
  }, [billingSameAsShipping, selectedShippingAddressId]);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        const userAddresses = response.data.addresses || [];
        setAddresses(userAddresses);

        if (response.data.email) {
          const email = String(response.data.email).trim();
          setUserEmail(email);
          setIsEmailFromProfile(isValidEmail(email));
        }

        const defaultAddr = userAddresses.find((a: Address) => a.isDefault);
        const fallbackAddressId = defaultAddr?._id || userAddresses[0]?._id || null;

        if (fallbackAddressId && !selectedShippingAddressIdRef.current) {
          setSelectedShippingAddressId(fallbackAddressId);
        }

        if (fallbackAddressId && !selectedBillingAddressIdRef.current) {
          setSelectedBillingAddressId(fallbackAddressId);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses", error);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const settings = await getSettings();
        setPlatformFee(Number(settings.platformFee) || 0);
        setBaseShippingFee(Number(settings.shippingFee) || 0);
        setFreeShippingThreshold(Number(settings.freeShippingThreshold) || 0);

        const threshold = Number(settings.freeShippingThreshold) || 0;
        if (netItemsTotal > threshold && threshold > 0) {
          setShippingCharges(0);
        } else {
          setShippingCharges(Number(settings.shippingFee) || 0);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettingsData();
  }, [netItemsTotal]);

  useEffect(() => {
    if (netItemsTotal > freeShippingThreshold && freeShippingThreshold > 0) {
      setShippingCharges(0);
    } else {
      setShippingCharges(baseShippingFee);
    }
  }, [netItemsTotal, freeShippingThreshold, baseShippingFee]);

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const buildShippingAddress = (selectedAddress: Address) => ({
    fullName: `${selectedAddress.firstName} ${selectedAddress.lastName}`.trim(),
    phoneNumber: selectedAddress.phoneNumber,
    addressLine1: selectedAddress.addressLine1,
    city: selectedAddress.city,
    state: selectedAddress.state,
    postalCode: selectedAddress.postalCode,
    country: selectedAddress.country || "India",
  });

  const getSelectedBillingAddress = () =>
    billingSameAsShipping ? selectedShippingAddressId : selectedBillingAddressId;

  const buildBillingAddress = (selectedAddress: Address) => ({
    fullName: `${selectedAddress.firstName} ${selectedAddress.lastName}`.trim(),
    phoneNumber: selectedAddress.phoneNumber,
    addressLine1: selectedAddress.addressLine1,
    city: selectedAddress.city,
    state: selectedAddress.state,
    postalCode: selectedAddress.postalCode,
    country: selectedAddress.country || "India",
  });

  const applyBuyNowCoupon = async (
    userId: string,
    couponMeta?: unknown,
    overrideCode?: string,
  ) => {
    const normalizedCode = (
      overrideCode ||
      recoveryCouponCode ||
      couponInput
    )
      .trim()
      .toUpperCase();
    if (!normalizedCode) {
      toast.error("Please enter a coupon code.");
      return;
    }

    if (couponMeta && isSingleUseCoupon(couponMeta) && hasRedeemedCoupon(userId, normalizedCode)) {
      setBuyNowCouponError("You have already used this coupon.");
      toast.error("You have already used this coupon.");
      return;
    }

    setBuyNowCouponError(null);
    setBuyNowBogoMessage(null);
    setBuyNowApplicableCategories([]);

    try {
      const response = await applyCouponApi(
        normalizedCode,
        grossItemsTotal,
        userId,
        normalizedActiveItems,
      );

      if (response.success) {
        const appliedCouponCode = String(response.data?.couponCode || normalizedCode);
        const discountAmount = Number(response.data?.discount) || 0;

        setBuyNowCouponCode(appliedCouponCode);
        setBuyNowCouponDiscount(discountAmount);

        if (response.data?.applicableIds && response.data.applicableIds.length > 0) {
          setBuyNowApplicableCategories(response.data.applicableIds);
        }

        if (response.data?.offerType === "BOGO") {
          setBuyNowBogoMessage(
            `Congrats! Your BOGO offer has been applied. You saved ₹${discountAmount.toFixed(2)}!`,
          );
        } else if (response.data?.offerType === "FixedAmount") {
          setBuyNowBogoMessage(`₹${discountAmount.toFixed(2)} flat discount applied!`);
        }

        if (isSingleUseCoupon(couponMeta) || isSingleUseCoupon(response.data as Record<string, unknown>)) {
          markCouponRedeemed(userId, appliedCouponCode);
        }

        toast.success("Coupon applied successfully!");
      } else {
        setBuyNowCouponCode("");
        setBuyNowCouponDiscount(0);
        setBuyNowCouponError(response.message || "Invalid coupon code.");
        toast.error(response.message || "Invalid coupon code.");
      }
    } catch (error) {
      console.error("Error applying buy-now coupon:", error);
      setBuyNowCouponCode("");
      setBuyNowCouponDiscount(0);
      setBuyNowCouponError("Could not apply coupon. Please try again.");
      toast.error("Could not apply coupon. Please try again.");
    }
  };

  const handleApplyCoupon = (
    userId: string | undefined,
    couponMeta?: unknown,
    overrideCode?: string,
  ) => {
    if (!userId && !isAuthenticated()) {
      toast.error("Please login to apply coupons.");
      return;
    }

    if (!userId) {
      toast.error("User session issue. Please try logging in again if this persists.");
      return;
    }

    if (isBuyNow) {
      void applyBuyNowCoupon(userId, couponMeta, overrideCode);
      return;
    }

    const normalizedCode = (
      overrideCode ||
      recoveryCouponCode ||
      couponInput
    )
      .trim()
      .toUpperCase();
    if (!normalizedCode) {
      toast.error("Please enter a coupon code.");
      return;
    }

    applyCoupon(normalizedCode, userId, couponMeta || undefined);
  };

  useEffect(() => {
    if (
      isBuyNow ||
      !recoveryCouponCode ||
      cart.length === 0 ||
      loading ||
      autoRecoveryCouponAppliedRef.current === recoveryCouponCode
    ) {
      return;
    }

    const currentUser = getUserDetails();
    const userId = currentUser?.id;
    if (!userId) {
      redirectToLogin(
        router,
        `${window.location.pathname}${window.location.search}`,
      );
      return;
    }

    if (couponCode === recoveryCouponCode) {
      autoRecoveryCouponAppliedRef.current = recoveryCouponCode;
      return;
    }

    autoRecoveryCouponAppliedRef.current = recoveryCouponCode;
    setCouponInput(recoveryCouponCode);
    void handleApplyCoupon(userId, couponMeta || undefined, recoveryCouponCode);
  }, [
    cart.length,
    couponCode,
    couponMeta,
    handleApplyCoupon,
    isBuyNow,
    loading,
    recoveryCouponCode,
  ]);

  const handleRemoveCoupon = () => {
    if (isBuyNow) {
      setCouponInput("");
      setBuyNowCouponCode("");
      setBuyNowCouponDiscount(0);
      setBuyNowCouponError(null);
      setBuyNowBogoMessage(null);
      setBuyNowApplicableCategories([]);
      toast.success("Coupon removed");
      return;
    }

    removeCoupon();
  };

  const handlePayOnline = async () => {
    const normalizedEmail = userEmail.trim();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!selectedShippingAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    const billingAddressId = getSelectedBillingAddress();
    if (!billingSameAsShipping && !billingAddressId) {
      toast.error("Please select a billing address.");
      return;
    }
    const selectedAddress = addresses.find((a) => a._id === selectedShippingAddressId);
    if (!selectedAddress) {
      toast.error("Invalid address selected.");
      return;
    }
    const billingSelectedAddress = addresses.find((a) => a._id === billingAddressId);
    if (!billingSelectedAddress) {
      toast.error("Invalid billing address selected.");
      return;
    }

    const shippingAddress = buildShippingAddress(selectedAddress);
    const billingAddress = buildBillingAddress(billingSelectedAddress);

    try {
      setIsSubmitting(true);
      toast.loading("Initiating payment...");
      const response = await createRazorpayPaymentLink(
        selectedShippingAddressId,
        shippingAddress,
        billingAddress,
        normalizedEmail,
        isBuyNow ? normalizedActiveItems : undefined,
        isBuyNow ? undefined : normalizedActiveItems,
        effectiveCouponCode
          ? {
              couponId: (couponMeta as { couponId?: string } | null)?.couponId,
              couponCode: effectiveCouponCode,
              discountPrice: effectiveCouponDiscount,
            }
          : undefined,
        recoveryAttribution || undefined,
      );
      toast.dismiss();
      const maybeOrderId =
        response?.data?.orderId ||
        response?.data?._id ||
        response?.data?.referenceId ||
        response?.data?.reference_id ||
        response?.data?.order?.id ||
        response?.data?.order?._id;

      if (maybeOrderId) {
        sessionStorage.setItem("checkout_invoice_order_id", String(maybeOrderId));
      }

      if (response?.success && response?.data?.short_url) {
        window.location.href = response.data.short_url;
      } else {
        toast.error(response.message || "Failed to create payment link");
      }
    } catch (error: unknown) {
      toast.dismiss();
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while initiating payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCOD = async () => {
    const normalizedEmail = userEmail.trim();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!selectedShippingAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    const billingAddressId = getSelectedBillingAddress();
    if (!billingSameAsShipping && !billingAddressId) {
      toast.error("Please select a billing address.");
      return;
    }
    const selectedAddress = addresses.find((a) => a._id === selectedShippingAddressId);
    if (!selectedAddress) {
      toast.error("Invalid address selected.");
      return;
    }
    const billingSelectedAddress = addresses.find((a) => a._id === billingAddressId);
    if (!billingSelectedAddress) {
      toast.error("Invalid billing address selected.");
      return;
    }
    if (normalizedActiveItems.length === 0) {
      toast.error(isBuyNow ? "No item to order." : "Your cart is empty.");
      return;
    }

    const shippingAddress = buildShippingAddress(selectedAddress);
    const billingAddress = buildBillingAddress(billingSelectedAddress);

    const orderItems = normalizedActiveItems.map((item) => ({
      product: item.product._id,
      variantId: item.variantId,
      name: item.product.name,
      image: item.product.mainImage?.url || item.variantImage || "",
      price: item.discountPrice || item.price,
      quantity: item.quantity,
      gstPercent: item.product?.gstPercent || 0,
      variant: {
        size: item.size,
        color: item.color,
        v_sku:
          ("variantSku" in item && typeof item.variantSku === "string"
            ? item.variantSku
            : item.product?.sku) || "",
      },
    }));

    const totalPayable = netItemsTotal + shippingCharges + platformFee;

    try {
      setIsSubmitting(true);
      toast.loading("Placing your order...");
      const response = await createCODOrder(
        shippingAddress,
        billingAddress,
        orderItems,
        normalizedEmail,
        {
          itemsPrice: grossItemsTotal,
          shippingPrice: shippingCharges,
          taxPrice: platformFee,
          totalPrice: totalPayable,
        },
        isBuyNow ? normalizedActiveItems : undefined,
        isBuyNow ? undefined : normalizedActiveItems,
        effectiveCouponCode
          ? {
              couponId: (couponMeta as { couponId?: string } | null)?.couponId,
              couponCode: effectiveCouponCode,
              discountPrice: effectiveCouponDiscount,
            }
          : undefined,
        recoveryAttribution || undefined,
      );
      toast.dismiss();
      if (response?.success) {
        const maybeOrderId =
          response?.data?.orderId ||
          response?.data?._id ||
          response?.data?.id ||
          response?.data?.order?.id ||
          response?.data?.order?._id;

        if (maybeOrderId) {
          sessionStorage.setItem(
            "checkout_invoice_order_id",
            String(maybeOrderId),
          );
        }

        toast.success("Order placed successfully!");
        router.push(
          `/checkout/success?payment_method=cod${maybeOrderId ? `&order_id=${encodeURIComponent(String(maybeOrderId))}` : ""}`,
        );
      } else {
        toast.error(response.message || "Failed to place order");
      }
    } catch (error: unknown) {
      toast.dismiss();
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsForPricing = isBuyNow ? normalizedActiveItems : activeItems;

  const categoryNames =
    effectiveApplicableCategories.length > 0
      ? itemsForPricing
          .filter(
            (item) =>
              item.product.category &&
              effectiveApplicableCategories.includes(item.product.category._id),
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
      <div className="w-full border py-5 border-gray-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center py-3 px-4 sm:px-6 md:px-10">
          {/* Logo */}
          <div className="flex items-center justify-between sm:justify-start">
            <Link href="/" className="cursor-pointer">
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
            <Link href='/cart' className="text-black font-medium ">BAG</Link>
            <div className="text-[#bd9951]">----------</div>
            <Link
              href="#"
              className="text-[#0d9842] font-medium hover:text-[#bd9951]"
            >
              ADDRESS
            </Link>
            <div className="text-[#bd9951]">----------</div>
            <div className="textblack cursor-not-allowed font-medium">PAYMENT</div>
          </div>

          {/* Secure Badge */}
          <div className="flex items-center justify-start sm:justify-end space-x-2 text-xs sm:text-[15px] font-[family-name:var(--font-montserrat)]">
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

      <div className="container mx-auto py-5 sm:py-8 px-3 sm:px-4 md:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start md:px-4">
          {/* LEFT COLUMN: ADDRESS */}
          <div className="w-full lg:w-[58%]">
            <div className="mb-6">
              <h4 className="text-lg sm:text-[24px] border-b border-gray-300 py-2 text-[#70480c] mb-3 sm:mb-4 font-medium font-[family-name:var(--font-montserrat)]">
                Customer Information
              </h4>
              <div className="mb-2">
                <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-bold text-black mb-1 cursor-default">
                  Enter Email Address *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) =>
                    !isEmailFromProfile && setUserEmail(e.target.value)
                  }
                  readOnly={isEmailFromProfile}
                  placeholder="Email Id"
                  className={`w-full border-b border-gray-300 rounded px-3 py-2 md:mb-1 text-sm focus:outline-none focus:border-[#bd9951] ${
                    isEmailFromProfile
                      ? "bg-gray-50 cursor-not-allowed"
                      : "cursor-text"
                  }`}
                  required
                />
                <p className="text-[13px] italic font-[family-name:var(--font-montserrat)] text-gray-500 mt-1">
                  This email will be used to send you offers & updates
                </p>
              </div>
            </div>

            {showAddForm ? (
              <AddressForm
                onSuccess={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                  fetchAddresses();
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                }}
                initialData={editingAddress || undefined}
                addressId={editingAddress?._id}
              />
            ) : (
              <>
                {addresses.length === 0 && !loadingAddresses ? (
                  <div className="border border-gray-200 p-8 text-center rounded shadow-sm">
                    <p className="text-gray-600 mb-4">
                      No addresses found. Please add a new address.
                    </p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-[#bd9951] text-white px-6 py-2 rounded font-semibold hover:bg-[#a38038] cursor-pointer transition-colors"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <AddressList
                    addresses={addresses}
                    selectedShippingAddressId={selectedShippingAddressId}
                    selectedBillingAddressId={selectedBillingAddressId}
                    billingSameAsShipping={billingSameAsShipping}
                    onSelectShippingAddress={setSelectedShippingAddressId}
                    onSelectBillingAddress={setSelectedBillingAddressId}
                    onToggleBillingSameAsShipping={setBillingSameAsShipping}
                    onRefresh={fetchAddresses}
                    onAddNew={() => {
                      setEditingAddress(null);
                      setShowAddForm(true);
                    }}
                    onEdit={handleEditAddress}
                  />
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="w-full lg:w-[42%] lg:sticky lg:top-6">
            <MiniCartSummary cartItems={normalizedActiveItems} />

            <PriceDetails
              couponInput={couponInput}
              setCouponInput={setCouponInput}
              handleApplyCoupon={handleApplyCoupon}
              couponError={effectiveCouponError}
              bogoMessage={effectiveBogoMessage}
              applicableCategories={effectiveApplicableCategories}
              categoryName={displayCategoryName}
              couponCode={effectiveCouponCode}
              couponMeta={couponMeta}
              onRemoveCoupon={handleRemoveCoupon}
              cartLength={normalizedActiveItems.length}
              totalMrp={activeTotalMrp}
              totalDiscount={activeTotalDiscount}
              couponDiscount={effectiveCouponDiscount}
              shippingCharges={shippingCharges}
              platformFee={platformFee}
              totalAmount={totalAmount}
              hideProceedButton={true}
            />

            {/* Payment Method Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handlePayOnline}
                disabled={!selectedShippingAddressId || isSubmitting}
                className="w-full cursor-pointer bg-[#bd9951] text-white py-3 rounded font-bold uppercase tracking-wider disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#a38038] transition-colors"
              >
                {isSubmitting ? "Processing..." : "Pay Online"}
              </button>
              <button
                onClick={handleCOD}
                disabled={!selectedShippingAddressId || isSubmitting}
                className="w-full cursor-pointer bg-white text-[#bd9951] py-3 rounded font-bold uppercase tracking-wider border-2 border-[#bd9951] disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#fdf8f0] transition-colors"
              >
                {isSubmitting ? "Processing..." : "Cash on Delivery"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Icons */}
        <div className="mt-10 py-4 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="flex items-center justify-center lg:justify-start text-sm">
            <Image
              src="/assets/icons/secure-payment.svg"
              alt="Secure Payments"
              width={30}
              height={30}
            />
            <span className="ml-2 text-sm sm:text-lg lg:text-xl text-[#706a42] font-semibold">
              Secure Payments
            </span>
          </div>
          <div className="flex items-center justify-center lg:justify-start text-sm">
            <Image
              src="/assets/icons/transaction.svg"
              alt="Cash on delivery"
              width={30}
              height={30}
            />
            <span className="ml-2 text-sm sm:text-lg lg:text-xl text-[#706a42] font-semibold">
              Cash on delivery
            </span>
          </div>
          <div className="flex items-center justify-center lg:justify-start text-sm">
            <Image
              src="/assets/icons/quality-assurance.svg"
              alt="Assured Quality"
              width={30}
              height={30}
            />
            <span className="ml-2 text-sm sm:text-lg lg:text-xl text-[#706a42] font-semibold">
              Assured Quality
            </span>
          </div>
          <div className="flex items-center justify-center lg:justify-start text-sm">
            <Image
              src="/assets/icons/product-return1.svg"
              alt="Easy returns"
              width={30}
              height={30}
            />
            <span className="ml-2 text-sm sm:text-lg lg:text-xl text-[#706a42] font-semibold">
              Easy returns
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Outer component wraps inner in Suspense ───────────────────────────────
const AddressPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <AddressPageInner />
    </Suspense>
  );
};

export default AddressPage;
