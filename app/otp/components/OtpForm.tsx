"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  ConfirmationResult,
  signInWithPhoneNumber,
} from "firebase/auth";
import {
  auth,
  setupInvisibleRecaptcha,
  resetRecaptcha,
  isRecaptchaAlreadyRenderedError,
  logAuthDebug,
} from "../../services/firebase";
import { verifyIdToken, login } from "../../services/authService";
import { mergeGuestCartOnLogin } from "../../hooks/useCart";
import { consumeRedirectTarget, syncRedirectFromQuery } from "../../utils/authRedirect";
import toast from "react-hot-toast";

declare global {
  interface Window {
    confirmationResult?: ConfirmationResult;
  }
}

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";
const RESEND_AVAILABLE_AT_KEY = "otp_resend_available_at";
const RESEND_DELAY_SECONDS = 20;

const OtpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    syncRedirectFromQuery(searchParams.get("redirect"));

    const storedPhone =
      sessionStorage.getItem("otp_phone_number") ||
      sessionStorage.getItem("login_phone_number") ||
      "";

    if (storedPhone) {
      setPhoneNumber(storedPhone);
    }

    if (!storedPhone) {
      toast.error("Please sign in again to continue.");
      router.replace("/login");
      return;
    }

    inputRefs.current[0]?.focus();
  }, [router, searchParams]);

  useEffect(() => {
    const syncCooldown = () => {
      const availableAt = Number(
        sessionStorage.getItem(RESEND_AVAILABLE_AT_KEY) || 0,
      );

      if (!availableAt) {
        setResendCooldown(0);
        return;
      }

      const remaining = Math.max(
        0,
        Math.ceil((availableAt - Date.now()) / 1000),
      );

      setResendCooldown(remaining);
      if (remaining === 0) {
        sessionStorage.removeItem(RESEND_AVAILABLE_AT_KEY);
      }
    };

    syncCooldown();
    const timer = window.setInterval(syncCooldown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startResendCooldown = () => {
    sessionStorage.setItem(
      RESEND_AVAILABLE_AT_KEY,
      String(Date.now() + RESEND_DELAY_SECONDS * 1000),
    );
    setResendCooldown(RESEND_DELAY_SECONDS);
  };

  const setupRecaptcha = async () => {
    return setupInvisibleRecaptcha(RECAPTCHA_CONTAINER_ID);
  };

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    if (digits.length > 1) {
      const nextOtp = [...otp];
      const splitDigits = digits.slice(0, 6).split("");

      splitDigits.forEach((digit, digitIndex) => {
        if (index + digitIndex < 6) {
          nextOtp[index + digitIndex] = digit;
        }
      });

      setOtp(nextOtp);
      const nextFocusIndex = Math.min(index + splitDigits.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (!otpString || otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      return toast.error("Please enter a valid 6-digit OTP.");
    }

    if (!window.confirmationResult) {
      return toast.error("Your OTP session expired. Please resend OTP.");
    }

    setLoading(true);

    try {
      const confirmationResult =
        window.confirmationResult as ConfirmationResult;
      logAuthDebug("otp", "verify:start", {
        hasConfirmationResult: Boolean(window.confirmationResult),
      });

      const userCredential = await confirmationResult.confirm(otpString);

      const idToken = await userCredential.user.getIdToken(true); // Force refresh

      const data = await verifyIdToken(idToken);

      if (data.success && data.token) {
        if (data.user?.status === "Inactive") {
          toast.error(
            "This ID has been blocked by the admin due to some reasons, please contact the team for further procedures",
            { duration: 6000 },
          );
          setLoading(false);
          return;
        }
        logAuthDebug("otp", "verify:success");
        login(data.token, data.user);
        sessionStorage.removeItem("otp_phone_number");
        sessionStorage.removeItem("login_phone_number");
        sessionStorage.removeItem(RESEND_AVAILABLE_AT_KEY);
        window.confirmationResult = undefined;
        resetRecaptcha(RECAPTCHA_CONTAINER_ID);
        // Merge any guest cart items into the user's server cart
        await mergeGuestCartOnLogin();
        toast.success("Logged in successfully!");
        const redirectUrl = consumeRedirectTarget();
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }
      } else {
        toast.error(data.message || "Backend login failed.");
        logAuthDebug("otp", "verify:backend-failed", {
          message: data.message || "",
        });
      }
    } catch (error: unknown) {
      const firebaseError = error as { constructor?: { name?: string }; message?: string; code?: string };
      logAuthDebug("otp", "verify:error", {
        message: firebaseError.message || "",
        code: firebaseError.code || "",
        type: firebaseError.constructor?.name || "Unknown",
      });
      toast.error(firebaseError.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      return toast.error("Please go back and enter your mobile number again.");
    }

    try {
      setResending(true);
      setOtp(["", "", "", "", "", ""]);
      logAuthDebug("otp", "resend:start", {
        hasPhoneNumber: Boolean(phoneNumber),
      });
      window.confirmationResult = undefined;
      const resendOtp = async () => {
        const appVerifier = await setupRecaptcha();
        return signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
      };

      let confirmationResult: ConfirmationResult;
      try {
        confirmationResult = await resendOtp();
      } catch (error) {
        if (!isRecaptchaAlreadyRenderedError(error)) {
          throw error;
        }

        logAuthDebug("otp", "resend:auto-retry", {
          reason: "duplicate-render",
        });
        resetRecaptcha(RECAPTCHA_CONTAINER_ID);
        confirmationResult = await resendOtp();
      }

      window.confirmationResult = confirmationResult;
      startResendCooldown();
      logAuthDebug("otp", "resend:success");
      toast.success("OTP sent again.");
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to resend OTP.";
      logAuthDebug("otp", "resend:error", {
        message: error instanceof Error ? error.message : String(error),
      });
      resetRecaptcha(RECAPTCHA_CONTAINER_ID);
      if (!isRecaptchaAlreadyRenderedError(error)) {
        toast.error(message);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center px-4 font-montserrat">
      <div className="w-full max-w-4xl bg-white shadow-xl overflow-hidden my-30">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[570px]">
          {/* Left Side - Image */}
          <div className="relative hidden md:block">
            <Image
              src="/assets/login-left.jpg"
              alt="OTP background"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Right Side - OTP Form */}
          <div className="flex items-center justify-center px-6 sm:px-10">
            <div className="w-full max-w-sm">
              {/* OTP Icon */}
              <div className="text-center md:text-left mb-6">
                <Image
                  src="/assets/icons/one-time-password.svg"
                  alt="OTP Icon"
                  width={64}
                  height={64}
                  className="mx-auto md:mx-0 mb-4"
                />
                <h1 className="text-2xl font-medium text-gray-900 mb-2 font-[family-name:var(--font-optima)]">
                  Verify with OTP
                </h1>
              <p className="text-gray-500 text-sm">
                Sent to your phone number.{" "}
                <Link
                  href="/login"
                  className="text-[#6b4a1f] hover:underline"
                  >
                    Edit
                  </Link>
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    autoCapitalize="off"
                    autoCorrect="off"
                    maxLength={index === 0 ? 6 : 1}
                    className="w-full h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b4a1f]"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                  />
                ))}
              </div>

              {/* Resend OTP */}
              <div className="text-left mb-6">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || resendCooldown > 0}
                  className="text-[#6b4a1f] hover:underline text-md font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resending
                    ? "RESENDING..."
                    : resendCooldown > 0
                      ? `RESEND IN ${resendCooldown}s`
                      : "RESEND OTP"}
                </button>
              </div>

              {/* Verify OTP Button */}
              <button
                className="w-full bg-[#6b4a1f] text-white py-3 text-md tracking-wide hover:bg-green-400 transition mb-6 cursor-pointer"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              {/* Trouble getting OTP */}
              <div className="text-left text-md">
                <p>
                  <strong>Trouble in getting OTP?</strong>
                  <br></br>
                  <span> Make sure you entered correct mobile number.</span>
                </p>
              </div>

              <div id={RECAPTCHA_CONTAINER_ID} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpForm;
