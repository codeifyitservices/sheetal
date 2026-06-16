"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setupInvisibleRecaptcha,
  resetRecaptcha,
  isRecaptchaAlreadyRenderedError,
  logAuthDebug,
} from "../../services/firebase";
import { verifyIdToken, login } from "../../services/authService";
import { mergeGuestCartOnLogin } from "../../hooks/useCart";
import {
  consumeRedirectTarget,
  syncRedirectFromQuery,
} from "../../utils/authRedirect";
import { getLoginCoupon } from "../../services/couponService";
import toast from "react-hot-toast";

declare global {
  interface Window {
    confirmationResult?: ConfirmationResult;
  }
}

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";
const RESEND_AVAILABLE_AT_KEY = "otp_resend_available_at";
const RESEND_DELAY_MS = 20_000;

interface LoginCoupon {
  code?: string;
  description?: string;
  offerType?: string;
  offerValue?: number;
  couponType?: string;
  endDate?: string;
  isActive?: boolean;
  scope?: "All" | "Category" | "Specific_Product";
  applicableIds?: Array<{ name?: string; slug?: string } | string>;
}

// ✅ Inner component that safely uses useSearchParams
const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"phone" | "google" | null>(
    null,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loginCoupon, setLoginCoupon] = useState<LoginCoupon | null>(null);

  useEffect(() => {
    syncRedirectFromQuery(searchParams.get("redirect"));
  }, [searchParams]);



  useEffect(() => {
    let isMounted = true;

    const fetchLoginCoupon = async () => {
      try {
        const response = await getLoginCoupon();
        const coupon = (response?.data || null) as LoginCoupon | null;

        if (isMounted) {
          setLoginCoupon(coupon);
        }
      } catch (error) {
        console.error("Failed to fetch login coupon:", error);
      }
    };

    fetchLoginCoupon();

    return () => {
      isMounted = false;
    };
  }, []);

  const isExpired = loginCoupon?.endDate
    ? new Date(loginCoupon.endDate) < new Date()
    : false;
  const isHidden = loginCoupon?.isActive === false || isExpired;
  const   loginCouponText =
    loginCoupon?.description ||
    (loginCoupon?.offerType === "Percentage"
      ? `Up to ${loginCoupon.offerValue}% off`
      : loginCoupon?.offerType === "FixedAmount"
        ? `Flat ₹${loginCoupon.offerValue} off`
        : loginCoupon?.offerType === "BOGO"
          ? "Buy One Get One Free"
          : "Special login offer");
  const loginCouponCode =
    loginCoupon?.couponType === "CouponCode" ? loginCoupon.code || null : null;
  const loginCouponTarget = (() => {
    const applicableItem =
      loginCoupon?.applicableIds && loginCoupon.applicableIds.length > 0
        ? loginCoupon.applicableIds[loginCoupon.applicableIds.length - 1]
        : null;
    const applicableSlug =
      applicableItem && typeof applicableItem === "object"
        ? applicableItem.slug || null
        : null;

    if (!loginCoupon || isHidden) return "/product-list";
    if (loginCoupon.scope === "Specific_Product" && applicableSlug) {
      return `/product/${applicableSlug}`;
    }
    if (loginCoupon.scope === "Category" && applicableSlug) {
      return `/${applicableSlug}`;
    }
    return "/product-list";
  })();

  const setupRecaptcha = async () => {
    return setupInvisibleRecaptcha(RECAPTCHA_CONTAINER_ID);
  };

  const handleContinue = async () => {
    if (!acceptedTerms) {
      toast.error("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setLoadingType("phone");
      logAuthDebug("login-phone", "send-otp:start", {
        phoneNumberLength: phoneNumber.length,
      });

      window.confirmationResult = undefined;
      sessionStorage.setItem("otp_phone_number", phoneNumber);
      sessionStorage.setItem("login_phone_number", phoneNumber);
      const sendOtp = async () => {
        const appVerifier = await setupRecaptcha();
        return signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
      };

      let confirmationResult: ConfirmationResult;
      try {
        confirmationResult = await sendOtp();
      } catch (error) {
        if (!isRecaptchaAlreadyRenderedError(error)) {
          throw error;
        }

        logAuthDebug("login-phone", "send-otp:auto-retry", {
          reason: "duplicate-render",
        });
        resetRecaptcha(RECAPTCHA_CONTAINER_ID);
        confirmationResult = await sendOtp();
      }

      window.confirmationResult = confirmationResult;
      logAuthDebug("login-phone", "send-otp:success");
      sessionStorage.setItem(
        RESEND_AVAILABLE_AT_KEY,
        String(Date.now() + RESEND_DELAY_MS),
      );
      router.push("/otp");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP";
      console.error("OTP error:", error);
      logAuthDebug("login-phone", "send-otp:error", {
        message: error instanceof Error ? error.message : String(error),
      });
      resetRecaptcha(RECAPTCHA_CONTAINER_ID);
      if (!isRecaptchaAlreadyRenderedError(error)) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleLogin = async () => {
    if (!acceptedTerms) {
      toast.error("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      setLoadingType("google");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const data = await verifyIdToken(idToken);

      if (data.success && data.token) {
        if (data.user?.status === "Inactive") {
          toast.error(
            "This ID has been blocked by the admin due to some reasons, please contact the team for further procedures",
            { duration: 6000 },
          );
          return;
        }
        login(data.token, data.user);
        await mergeGuestCartOnLogin();
        toast.success("Logged in successfully!");
        const redirectUrl = consumeRedirectTarget();
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }
      } else {
        const isBlocked =
          data.message?.toLowerCase().includes("blocked") ||
          data.message?.toLowerCase().includes("inactive");

        if (isBlocked) {
          toast.error(
            "This ID has been blocked by the admin due to some reasons, please contact the team for further procedures",
            { duration: 6000 },
          );
        } else {
          toast.error(data.message || "Backend login failed.");
        }
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      console.error("Google Login Error:", error);
      if (
        firebaseError.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "An account already exists with this email but using a different sign-in method (like phone). Please sign in using your original method or link accounts in your profile.",
          { duration: 6000 },
        );
      } else {
        toast.error(firebaseError.message || "Failed to login with Google");
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center px-4 font-montserrat">
      <div className="w-full max-w-4xl bg-white shadow-xl overflow-hidden my-30">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[570px]">
          {/* LEFT IMAGE */}
          <div className="relative hidden md:block overflow-hidden">
            <Image
              src="/assets/updated-login-left.jpg"
              alt="Register Offer"
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/50 to-transparent" />

            {!isHidden && (
              <div className="absolute inset-x-0 bottom-0 z-10 text-white text-center px-2 pb-8">
                <p className="font-['Times_New_Roman'] text-[18px] md:text-[24px] leading-[1.5] tracking-[0.08em] uppercase font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  {loginCouponText}
                </p>

                {loginCouponCode ? (
                  <div className="mt-5 inline-flex rounded items-center gap-3 border border-dashed border-white/80 bg-transparent px-6 py-2.5">
                    <span className="text-[16px] font-bold tracking-[0.28em] text-white uppercase">
                      Use Code :
                    </span>
                    <span className="text-[16px] font-bold tracking-[0.28em] text-white uppercase">
                      {loginCouponCode}
                    </span>
                  </div>
                ) : (
                  <div className="mt-5 inline-flex items-center border border-dashed border-white/80 bg-transparent px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.28em]">
                    Login offer available now
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT FORM */}
          <div className="flex items-center justify-center px-6 sm:px-10">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-medium text-gray-900 mb-6 font-[family-name:var(--font-optima)]">
                Login or Signup
              </h1>

              <div className="flex items-center border border-gray-300 mb-4">
                <span className="px-3 text-sm text-gray-700 border-r bg-gray-50">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  className="w-full px-3 py-3 text-sm focus:outline-none"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>

              <div className="flex items-start gap-2 text-lg mb-6">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 accent-[#6b4a1f]"
                />
                <p>
                  By continuing, I agree to the{" "}
                  <Link
                    href="/terms-conditions"
                    className="underline text-[#6b4a1f]"
                  >
                    Terms of Use
                  </Link>{" "}
                  &{" "}
                  <Link
                    href="/privacy-policy"
                    className="underline text-[#6b4a1f]"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and I am above 18 years old.
                </p>
              </div>

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-[#6b4a1f] text-white py-3 text-md tracking-wide hover:bg-green-400 transition mb-6 cursor-pointer"
              >
                {loading
                  ? loadingType === "google"
                    ? "Verifying..."
                    : "Sending OTP…"
                  : "Continue"}
              </button>

              <div className="flex items-center justify-center my-3">
                <span className="px-3 text-md">Or Continue with</span>
              </div>

              <div className="flex justify-center gap-6 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-10 h-10 flex items-center justify-center cursor-pointer"
                >
                  <Image
                    src="/assets/icons/google.svg"
                    alt="Google"
                    width={25}
                    height={25}
                  />
                </button>
              </div>

              <div id={RECAPTCHA_CONTAINER_ID}></div>

              <p className="text-left text-md mt-4">
                Have trouble logging in?{" "}
                <Link href="/contact-us" className="underline">
                  Get help
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
