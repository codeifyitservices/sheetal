"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getToken, getUserDetails, isAuthenticated } from "@/app/services/authService";
import {
  getAllCouponsClient,
  getValidAbandonedCartCoupon,
} from "@/app/services/couponService";
import {
  hasRedeemedCoupon,
  isSingleUseCoupon,
} from "@/app/utils/couponRedemption";
import {
  consumeRedirectField,
  consumeRedirectModalState,
  peekRedirectField,
  peekRedirectModalState,
  redirectToLogin,
} from "@/app/utils/authRedirect";
import useSWR from "swr";
import { getSettings } from "@/app/services/settingsService";
import { X } from "lucide-react";

interface PriceDetailsProps {
  couponInput: string;
  setCouponInput: (value: string) => void;
  handleApplyCoupon: (
    userId: string | undefined,
    couponMeta?: unknown,
    overrideCode?: string,
  ) => void;
  couponError: string | null;
  bogoMessage: string | null;
  applicableCategories: string[];
  categoryName: string | null | undefined;
  cartLength: number;
  totalMrp: number;
  totalDiscount: number;
  couponDiscount: number;
  shippingCharges: number;
  platformFee: number;
  totalAmount: number;
  couponCode?: string;
  couponMeta?: unknown;
  onRemoveCoupon?: () => void;
  hideProceedButton?: boolean;
  /** Called when the user clicks Proceed to Buy */
  onProceed?: () => void;
}

interface CouponOption {
  _id?: string;
  id?: string;
  code: string;
  offerType?: string;
  offerValue?: number;
  scope?: string;
  applicableIds?: Array<{ name?: string } | string>;
  description?: string;
  minPurchase?: number;
  isAbandonedCartCoupon?: boolean;
}

const isRecoveryCoupon = (coupon: unknown): coupon is CouponOption => {
  if (!coupon || typeof coupon !== "object") {
    return false;
  }

  return Boolean(
    (coupon as { isAbandonedCartCoupon?: boolean }).isAbandonedCartCoupon,
  );
};

const PriceDetails: React.FC<PriceDetailsProps> = ({
  couponInput,
  setCouponInput,
  handleApplyCoupon,
  couponError,
  bogoMessage,
  applicableCategories,
  cartLength,
  totalMrp,
  totalDiscount,
  couponDiscount,
  shippingCharges,
  platformFee,
  totalAmount,
  couponCode,
  couponMeta,
  onRemoveCoupon,
  hideProceedButton = false,
  onProceed,
}) => {
  const router = useRouter();
  const [openCouponModal, setOpenCouponModal] = useState(false);
  const [coupons, setCoupons] = useState<CouponOption[]>([]);
  const [recoveryCouponState, setRecoveryCouponState] = useState<
    "idle" | "loading" | "found" | "missing"
  >("idle");
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(
    () => peekRedirectField<string>("selectedCouponCode") || couponCode || null,
  );
  const [selectedCouponMeta, setSelectedCouponMeta] = useState<unknown>(
    couponMeta || null,
  );
  const [shouldRestoreCouponModal] = useState(() =>
    peekRedirectModalState("couponModalOpen"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [manualMsg, setManualMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: settings } = useSWR("/settings", getSettings);
  const [showPlatformFeeModal, setShowPlatformFeeModal] = useState(false);

  useEffect(() => {
    if (!shouldRestoreCouponModal) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOpenCouponModal(true);
      consumeRedirectModalState("couponModalOpen");
      consumeRedirectField<string>("couponInput");
      consumeRedirectField<string>("selectedCouponCode");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [shouldRestoreCouponModal]);

  useEffect(() => {
    if (openCouponModal) {
      const token = getToken();
      const fetchCoupons = async () => {
        try {
          const response = await getAllCouponsClient(token);
          const list = response?.data?.data || response?.data || [];
          setCoupons(Array.isArray(list) ? list : []);
        } catch (error) {
          console.error("Error fetching coupons:", error);
          setCoupons([]);
        }
      };
      const fetchRecoveryCoupon = async () => {
        try {
          setRecoveryCouponState("loading");
          const response = await getValidAbandonedCartCoupon(token);
          const responseData = response.data;
          const coupon =
            responseData &&
            typeof responseData === "object" &&
            "data" in responseData
              ? ((responseData as { data?: { code?: string } | null }).data ||
                  null)
              : ((responseData as { code?: string } | null) || null);
          if (coupon?.code) {
            setRecoveryCouponState("found");
          } else {
            setRecoveryCouponState("missing");
          }
        } catch (error) {
          console.error("Error fetching abandoned-cart coupon:", error);
          setRecoveryCouponState("missing");
        }
      };
      fetchCoupons();
      fetchRecoveryCoupon();
    }
  }, [openCouponModal, couponCode]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const publicCoupons = coupons.filter((c) => {
    if (c.isAbandonedCartCoupon === true) {
      return false;
    }

    if (!normalizedSearchQuery) {
      return true;
    }

    return (
      c.code.toLowerCase().includes(normalizedSearchQuery) ||
      c.description?.toLowerCase().includes(normalizedSearchQuery) ||
      false
    );
  });
  const visibleCoupons = publicCoupons;

  useEffect(() => {
    if (!openCouponModal) {
      return;
    }

    if (isRecoveryCoupon(selectedCouponMeta)) {
      setSelectedCouponCode(null);
      setSelectedCouponMeta(null);
    }

    if (isRecoveryCoupon(couponMeta)) {
      setCouponInput("");
    }
  }, [couponMeta, openCouponModal, selectedCouponMeta, setCouponInput]);

  const applyCouponAndClose = () => {
    const user = getUserDetails();
    const enteredCode = couponInput.trim().toUpperCase();

    if (!enteredCode) {
      toast.error("Please enter a coupon code.");
      return;
    }

    // Use id or _id as a fallback
    const userId = user?.id || (user as any)?._id;
    const isAuth = isAuthenticated();

    if (!userId && !isAuth) {
      // ONLY redirect if the user is truly NOT authenticated.
      // If they ARE authenticated but userId is missing, we try to proceed 
      // or at least don't force a login redirect which causes the "logged in but redirected" bug.
      redirectToLogin(router, undefined, {
        modals: {
          couponModalOpen: true,
        },
        couponInput: enteredCode,
        selectedCouponCode:
          selectedCouponCode || enteredCode || undefined,
      });
      return;
    }

    if (
      (selectedCouponMeta || couponMeta) &&
      isSingleUseCoupon(selectedCouponMeta || couponMeta) &&
      userId &&
      hasRedeemedCoupon(userId, enteredCode)
    ) {
      toast.error("You have already used this coupon.");
      return;
    }

    handleApplyCoupon(
      userId,
      selectedCouponMeta || couponMeta,
      enteredCode,
    );
    setOpenCouponModal(false);
  };

  const handleRemoveCoupon = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
    }
    setCouponInput("");
    setSelectedCouponCode(null);
  };

  return (
    <>
      <div className="mt-5 font-[family-name:var(--font-montserrat)]">
        <div className="p-4">
          <h3 className="text-[15px] font-bold mb-4 uppercase transform scale-y-90 tracking-[1px] font-[family-name:var(--font-montserrat)]">
            Coupons
          </h3>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src="/assets/icons/tag.svg"
                alt="Coupon"
                width={20}
                height={20}
              />
              <h1 className="text-[15px] text-[#333333] font-semibold mb-1">
                {couponCode ? (
                  <span className="text-green-600">{couponCode}</span>
                ) : (
                  "Apply Coupons"
                )}
              </h1>
            </div>

            {couponCode && onRemoveCoupon ? (
              <button onClick={handleRemoveCoupon} className="mr-2">
                <Image
                  src="/assets/icons/delete.svg"
                  alt="Info"
                  width={16}
                  height={16}
                  className="inline-block mr-2 cursor-pointer"
                />
              </button>
            ) : null}

            <button
              onClick={() => {
                const shouldHideCurrentRecoveryCoupon = isRecoveryCoupon(
                  couponMeta,
                );

                setSelectedCouponCode(
                  shouldHideCurrentRecoveryCoupon ? null : (couponCode ?? null),
                );
                setCouponInput(
                  shouldHideCurrentRecoveryCoupon ? "" : (couponCode ?? ""),
                );
                setSelectedCouponMeta(
                  shouldHideCurrentRecoveryCoupon ? null : (couponMeta ?? null),
                );
                setOpenCouponModal(true);
              }}
              className="text-[#6a3f07] font-semibold border border-[#6a3f07] rounded px-2.5 py-0.5 text-sm cursor-pointer"
            >
              {couponCode ? "CHANGE" : "APPLY"}
            </button>
          </div>

          {couponError && (
            <p className="text-red-500 text-xs mt-2">{couponError}</p>
          )}

          {bogoMessage && (
            <p className="text-green-600 text-sm mt-2 font-medium">
              {bogoMessage}
            </p>
          )}

          {couponDiscount > 0 && (
            <p className="text-blue-600 text-sm mt-2">
              {applicableCategories.length > 0
                ? "Coupon applied to applicable items."
                : "Coupon applied to all items."}
            </p>
          )}

          <h3 className="text-[15px] font-bold mb-4 uppercase mt-5">
            Price Details ({cartLength} {cartLength === 1 ? "Item" : "Items"})
          </h3>

          <div className="space-y-5 text-sm">
            <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
              <span className="font-medium">Total MRP</span>
              <span className=" font-medium">₹{totalMrp.toFixed(2)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                <span className="font-medium">Discount on MRP</span>
                <span className="text-green-600 font-medium">
                  -₹{totalDiscount.toFixed(2)}
                </span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                <span className="font-medium">Coupon Discount</span>
                <span className="text-green-600 font-semibold font-medium">
                  -₹{couponDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
              <span className="font-medium">Shipping Charges</span>
              <span className={shippingCharges === 0 ? "text-green-600" : ""}>
                {shippingCharges === 0
                  ? "FREE"
                  : `₹${shippingCharges.toFixed(2)}`}
              </span>
            </div>

            {platformFee > 0 && (
              <div className="flex justify-between font-[family-name:var(--font-montserrat)]">
                <span className="flex items-center">
                  Platform Fee
                  <button
                    onClick={() => setShowPlatformFeeModal(true)}
                    className="text-[#73561e] text-sm font-medium underline ml-3 cursor-pointer"
                  >
                    Know More
                  </button>
                </span>

                <span className="text-gray-900">₹{platformFee.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex font-[family-name:var(--font-montserrat)] justify-between font-bold text-lg mt-3 border-t border-gray-200 pt-3">
            <span>Total Amount</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>

          <p className="text-[12px] font-[family-name:var(--font-montserrat)] font-bold text-gray-500 text-right mt-1">
            Tax included. Shipping Calculated at checkout.
          </p>

          {!hideProceedButton && (
            <button
              onClick={onProceed}
              className="w-full block text-[20px] font-[family-name:var(--font-montserrat)] text-center bg-[#72561e] text-white py-3 rounded-[5px] mt-6 font-semibold uppercase hover:bg-green-500 transition-colors cursor-pointer transform duration-200"
            >
              Proceed to Buy
            </button>
          )}
        </div>
      </div>

      {openCouponModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-semibold">Apply Coupon</h2>
              <button
                className="cursor-pointer text-2xl hover:text-gray-600"
                onClick={() => {
                  setOpenCouponModal(false);
                  setManualMsg(null);
                  setSearchQuery("");
                }}
              >
                ✕
              </button>
            </div>

            {/* Search bar — only new addition */}
            <div className="flex items-center w-full px-10 py-6">
              <div className="border-slate-300 border-2 flex items-center w-full">
                <input
                  type="text"
                  name="coupon"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setSearchQuery(e.target.value.toUpperCase());
                    setManualMsg(null);
                  }}
                  className="w-full h-15 px-4"
                  placeholder="Enter coupon code"
                />
                <button
                  className="text-center p-4"
                  onClick={() => {
                    const val = couponInput.trim().toUpperCase();
                    const match = visibleCoupons.find((c) => c.code === val);
                    if (match) {
                      setSelectedCouponCode(match.code);
                      setSelectedCouponMeta(match);
                      setCouponInput(match.code);
                      setManualMsg({
                        type: "success",
                        text: `"${match.code}" found and selected.`,
                      });
                    } else {
                      setSelectedCouponCode(val || null);
                      setSelectedCouponMeta(null);
                      setManualMsg({
                        type: "error",
                        text: val
                          ? `Coupon "${val}" is not in the public coupon list. If this is a recovery code, it will be validated on apply.`
                          : "Please enter a coupon code.",
                      });
                    }
                  }}
                >
                  Check
                </button>
              </div>
            </div>
            {manualMsg && (
              <p
                className={`text-xs px-10 -mt-4 mb-2 ${manualMsg.type === "error" ? "text-red-500" : "text-green-600"}`}
              >
                {manualMsg.text}
              </p>
            )}

            {recoveryCouponState === "missing" && (
              <p className="text-xs px-10 -mt-1 mb-2 text-gray-500">
                No valid recovery coupon is available for your account. If you
                were expecting one, it may have expired.
              </p>
            )}

            {/* Coupon list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {visibleCoupons.length > 0 ? (
                visibleCoupons.map((coupon, index) => (
                  <div
                    key={`${coupon._id || coupon.id || coupon.code}-${index}`}
                    className={`border border-dashed p-4 rounded-md cursor-pointer ${
                      selectedCouponCode === coupon.code
                        ? "border-[#6a3f07] border-2"
                        : "border-gray-500"
                    }`}
                    onClick={() => {
                      setSelectedCouponCode(coupon.code);
                      setCouponInput(coupon.code);
                      setSelectedCouponMeta(coupon);
                      setSearchQuery(coupon.code);
                      setManualMsg(null);
                    }}
                  >
                    <div className="font-bold border border-dashed border-gray-500 text-[#6b5639] mb-2 uppercase text-lg p-2 w-full">
                      {coupon.code}
                    </div>
                    <div className="flex flex-wrap justify-start gap-1 mt-2">
                      {coupon.offerType === "BOGO" && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5">
                          Buy 1 Get 1
                        </span>
                      )}
                      {coupon.scope === "Category" &&
                        coupon.applicableIds &&
                        coupon.applicableIds.length > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5">
                            {typeof coupon.applicableIds[0] === "object" &&
                            coupon.applicableIds[0].name
                              ? coupon.applicableIds[0].name
                              : "Category Offer"}
                          </span>
                        )}
                      {coupon.scope === "Specific_Product" && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5">
                          Product Offer
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-gray-800 mt-2">
                      {coupon.offerType === "Percentage"
                        ? `Get ${coupon.offerValue}% OFF`
                        : coupon.offerType === "FixedAmount"
                          ? `Save ₹${coupon.offerValue}`
                          : coupon.offerType === "BOGO"
                            ? coupon.description
                            : `${coupon.offerType} Offer`}
                    </div>

                    {coupon.description && coupon.offerType !== "BOGO" && (
                      <div className="text-xs text-gray-600">
                        {coupon.description}
                      </div>
                    )}

                    {coupon.minPurchase && (
                      <div className="text-xs text-gray-500">
                        Min. purchase: ₹{coupon.minPurchase}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-center text-gray-500 mb-2">
                    No coupons match your search.
                  </p>
                  <p className="text-sm text-gray-400">
                    Check back later for exclusive offers or recovery emails.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200">
              <button
                onClick={applyCouponAndClose}
                disabled={!couponInput.trim()}
                className="w-full bg-[#ff9900] cursor-pointer text-white py-3 font-bold uppercase transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#e68a00]"
              >
                Apply Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Fee Modal */}
      {showPlatformFeeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Image src="/assets/icons/tag.svg" alt="" width={18} height={18} className="opacity-70" />
                Platform Fee
              </h2>
              <button
                className="cursor-pointer p-1 hover:bg-white rounded-full transition-colors"
                onClick={() => setShowPlatformFeeModal(false)}
              >
                <X/>
              </button>
            </div>

            <div className="p-8">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-[#6a3f07] text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                  {settings?.platformFeeKnowMore ||
                    "This small fee helps us maintain our platform and continue providing you with the best shopping experience and premium quality products."}
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowPlatformFeeModal(false)}
                  className="bg-[#72561e] text-white px-10 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#5a4318] transition-colors cursor-pointer shadow-lg shadow-amber-900/10"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceDetails;
