"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";
import { getApiImageUrl } from "@/app/services/api";
import { getSharedCart } from "../../services/cartService";
import { useSettings } from "../../hooks/useSettings";
import { getLogoUrl } from "../../services/settingsService";

import { getSettings } from "@/app/services/settingsService";
import { isAuthenticated } from "@/app/services/authService";
import { redirectToLogin } from "@/app/utils/authRedirect";
import { buildProductHref } from "@/app/utils/productRoutes";
import type { CartItem } from "@/app/hooks/useCart";
import HideStorefrontHeader from "@/app/components/HideStorefrontHeader";

const SharedCartPage = () => {
  const { settings: brandSettings } = useSettings();
  const logoUrl = getLogoUrl(brandSettings);
  const router = useRouter();
  const params = useParams<{ token?: string | string[] }>();
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] || "" : rawToken?.trim() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [baseShippingFee, setBaseShippingFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("Invalid shared cart link.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSharedCart = async () => {
      try {
        const response = await getSharedCart(token);
        if (cancelled) return;

        if (!response?.success) {
          setError(response?.message || "Shared cart not found.");
          setItems([]);
          return;
        }

        setItems(Array.isArray(response?.data?.items) ? response.data.items : []);
        setExpiresAt(response?.data?.expiresAt || null);
      } catch (loadError) {
        if (cancelled) return;
        console.error("Failed to load shared cart:", loadError);
        setError("Could not load shared cart.");
        setItems([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSharedCart();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const summary = useMemo(() => {
    const mrp = items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );
    const discounted = items.reduce(
      (sum, item) => sum + (item.discountPrice ?? item.price ?? 0) * item.quantity,
      0,
    );
    return { mrp, discounted };
  }, [items]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettings();
        setPlatformFee(Number(settings.platformFee) || 0);
        setBaseShippingFee(Number(settings.shippingFee) || 0);
        setFreeShippingThreshold(Number(settings.freeShippingThreshold) || 0);

        const threshold = Number(settings.freeShippingThreshold) || 0;
        if (summary.discounted > threshold && threshold > 0) {
          setShippingCharges(0);
        } else {
          setShippingCharges(Number(settings.shippingFee) || 0);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    void fetchSettings();
  }, [summary.discounted]);

  useEffect(() => {
    if (summary.discounted > freeShippingThreshold && freeShippingThreshold > 0) {
      setShippingCharges(0);
    } else {
      setShippingCharges(baseShippingFee);
    }
  }, [summary.discounted, freeShippingThreshold, baseShippingFee]);

  const totalAmount = summary.discounted + shippingCharges + platformFee;

  const handleCheckout = () => {
    const checkoutUrl = `/checkout/address?sharedCartToken=${encodeURIComponent(token)}`;
    if (!isAuthenticated()) {
      redirectToLogin(router, checkoutUrl);
      return;
    }
    router.push(checkoutUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-[#6a3f07] font-semibold">Loading shared cart...</div>
      </div>
    );
  }

  return (
    <div className="font-montserrat bg-white min-h-screen">
      <HideStorefrontHeader />
      <div className="w-full">
        <div className="flex justify-between items-center py-8 px-6 md:px-10">
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

          <div className="hidden md:flex items-center text-[15px] space-x-2 font-[family-name:var(--font-montserrat)]">
            <div className="text-[#0d9842] font-medium">BAG</div>
            <div className="text-[#bd9951]">----------</div>
            <div className="text-black font-medium">ADDRESS</div>
            <div className="text-[#bd9951]">----------</div>
            <div className="textblack cursor-not-allowed font-medium">PAYMENT</div>
          </div>

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

      <div className="container mx-auto py-8 px-4 md:px-8 lg:px-12">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl font-semibold text-gray-700 mb-4">
              Shared cart unavailable
            </p>
            <p className="text-gray-500 mb-8">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-[#6a3f07] text-white rounded-md font-bold hover:bg-[#5a2f00] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-8/12">
              <div className="flex flex-wrap justify-start items-center gap-3 mb-4">
                <div className="flex items-end gap-2 mr-4">
                  <h2 className="text-[#6a3f07] font-optima">Shared Cart</h2>
                  <span className="text-[16px] font-normal mb-1 font-[family-name:var(--font-montserrat)]">
                    ({items.length} items)
                  </span>
                </div>
                {expiresAt ? (
                  <span className="text-xs text-gray-500">
                    Expires {new Date(expiresAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const displayOriginalPrice = item.price ?? 0;
                  const displayDiscountPrice =
                    item.discountPrice ?? displayOriginalPrice;
                  const discountPercentage =
                    displayOriginalPrice > 0
                      ? Math.round(
                          ((displayOriginalPrice - displayDiscountPrice) /
                            displayOriginalPrice) *
                            100,
                        )
                      : 0;

                  const productHref = buildProductHref(item.product);

                  return (
                    <div key={item._id} className="flex items-start py-3 gap-3">
                      <div className="w-[70px] md:w-[100px] shrink-0">
                        <Image
                          src={getApiImageUrl(
                            item.variantImage || item.product.mainImage?.url,
                          )}
                          alt={item.product.name}
                          width={120}
                          height={160}
                          className="w-full h-auto"
                        />
                      </div>

                      <div className="flex flex-1 flex-col md:flex-row md:items-start md:justify-between gap-2 min-w-0 md:pr-20">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] md:text-[15px] tracking-[1px] leading-snug line-clamp-2 font-[family-name:var(--font-montserrat)]">
                            <Link
                              href={productHref}
                              className="hover:text-[#bd9951] transition-colors"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-xs md:text-[12px] tracking-[1px] text-gray-600 mt-1 font-[family-name:var(--font-montserrat)]">
                            <strong>Color:</strong> {item.color} |{" "}
                            <strong>Size:</strong> {item.size}
                          </p>
                          {/* <p className="text-xs md:text-[12px] tracking-[1px] text-[#bd9951] font-[family-name:var(--font-montserrat)] mt-2">
                            Shared cart view
                          </p> */}
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shrink-0">
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 md:justify-end font-bold font-[family-name:var(--font-montserrat)]">
                            <span className="text-[13px] md:text-[14px]">
                              ₹{(displayDiscountPrice * item.quantity).toFixed(2)}
                            </span>
                            {displayOriginalPrice > displayDiscountPrice && (
                              <span className="text-[14px] text-gray-500 line-through">
                                ₹{(displayOriginalPrice * item.quantity).toFixed(2)}
                              </span>
                            )}
                            {discountPercentage > 0 && (
                              <span className="text-[14px] text-[#6a3f0e]">
                                [ {discountPercentage}% OFF ]
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-4 text-center">{item.quantity}</span>
                          </div>
                        </div>

                        <div />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-4/12 lg:sticky lg:top-6">
              <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
                <h2 className="text-[15px] font-bold mb-4 uppercase mt-1">
                  Price Details ({items.length} {items.length === 1 ? "Item" : "Items"})
                </h2>

                <div className="space-y-5 text-sm">
                  <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                    <span className="font-medium">Total MRP</span>
                    <span className="font-medium">₹{summary.mrp.toFixed(2)}</span>
                  </div>

                  {summary.mrp > summary.discounted && (
                    <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                      <span className="font-medium">Discount on MRP</span>
                      <span className="text-green-600 font-medium">
                        -₹{(summary.mrp - summary.discounted).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                    <span className="font-medium">Shipping Charges</span>
                    <span className={shippingCharges === 0 ? "text-green-600" : ""}>
                      {shippingCharges === 0 ? "FREE" : `₹${shippingCharges.toFixed(2)}`}
                    </span>
                  </div>

                  {platformFee > 0 && (
                    <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                      <span className="font-medium">Platform Fee</span>
                      <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                    <span className="font-medium">Item Total</span>
                    <span className="font-medium">₹{summary.discounted.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex font-[family-name:var(--font-montserrat)] justify-between font-bold text-lg mt-3 border-t border-gray-200 pt-3">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full block text-[20px] font-[family-name:var(--font-montserrat)] text-center bg-[#72561e] text-white py-3 rounded-[5px] mt-6 font-semibold uppercase hover:bg-green-500 transition-colors cursor-pointer transform duration-200"
                >
                  Proceed to Buy
                </button>

                <p className="text-[12px] font-[family-name:var(--font-montserrat)] font-bold text-gray-500 text-right mt-1">
                  Shared cart. Checkout will not alter the sender&apos;s cart.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SharedCartPage;
