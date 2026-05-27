"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { updateUserProfile, getCurrentUser } from "../../services/userService";
import { getApiImageUrl } from "../../services/api";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import {
  auth,
  setupInvisibleRecaptcha,
  resetRecaptcha,
  isRecaptchaAlreadyRenderedError,
  logAuthDebug,
} from "../../services/firebase";
import {
  verifyIdToken,
  login,
  sendEmailOtp,
  verifyEmailOtp,
  updateUserDetailsInLocalStorage,
} from "../../services/authService";
import toast from "react-hot-toast";

const RESEND_AVAILABLE_AT_KEY = "otp_resend_available_at";
const RESEND_DELAY_SECONDS = 20;

const EditProfile: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeMobileNumber, setAlternativeMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  // Phone Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email Verification States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const emailInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // 1. Fetch User Data from DB
    const fetchUserData = async () => {
      try {
        setInitialLoading(true);
        const res = await getCurrentUser();
        if (res.success && res.data) {
          const userDetails = res.data;
          setName(userDetails.name || "");

          if (userDetails.email) {
            setEmail(userDetails.email);
            setIsEmailVerified(true);
          } else {
            setEmail("");
            setIsEmailVerified(false);
          }

          // Use DB phone if available
          if (userDetails.phoneNumber) {
            setMobileNumber(userDetails.phoneNumber);
            setIsPhoneVerified(true);
          }

          setAlternativeMobileNumber(userDetails.alternativeMobileNumber || "");
          setDateOfBirth(
            userDetails.dateOfBirth
              ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
              : "",
          );
          setGender(userDetails.gender || "Male");
          setProfilePictureUrl(getApiImageUrl(userDetails.profilePicture));
        } else {
          setInitialError("Failed to fetch user data.");
        }
      } catch (err: any) {
        setInitialError(
          err.message || "An error occurred while fetching user data.",
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();

    // 2. Sync with Firebase Auth (e.g. if DB phone is missing but Firebase has simple link)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.phoneNumber && !mobileNumber) {
        // Removing +91 prefix if present for clean input
        const cleanPhone = user.phoneNumber.replace(/^\+91/, "");

        // Only set if we haven't already fetched a number from DB
        setMobileNumber((prev) => prev || cleanPhone);
        setIsPhoneVerified(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [profilePicturePreview]); // Removed mobileNumber dependency to avoid loops

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

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  const setupRecaptcha = async () => {
    return setupInvisibleRecaptcha("recaptcha-container");
  };

  const startResendCooldown = () => {
    sessionStorage.setItem(
      RESEND_AVAILABLE_AT_KEY,
      String(Date.now() + RESEND_DELAY_SECONDS * 1000),
    );
    setResendCooldown(RESEND_DELAY_SECONDS);
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setPhoneLoading(true);
      setConfirmationResult(null);
      logAuthDebug("profile-phone", "send-otp:start", {
        hasCurrentUserPhone: Boolean(auth.currentUser?.phoneNumber),
        mobileNumberLength: mobileNumber.length,
      });

      const formattedNumber = `+91${mobileNumber}`;

      // Check if ALREADY matched in our current Firebase session
      if (auth.currentUser?.phoneNumber === formattedNumber) {
        logAuthDebug("profile-phone", "send-otp:already-verified");
        setIsPhoneVerified(true);
        setShowOtpInput(false);
        toast.success("Phone number verified successfully!");
        setPhoneLoading(false);
        return;
      }

      // We use signInWithPhoneNumber instead of linkWithPhoneNumber
      // to avoid 'account-exists-with-different-credential' errors.
      // The backend verifyIdToken call will handle the logical merging of accounts.
      const sendOtp = async () => {
        const appVerifier = await setupRecaptcha();
        return signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      };

      let result: ConfirmationResult;
      try {
        result = await sendOtp();
      } catch (error) {
        if (!isRecaptchaAlreadyRenderedError(error)) {
          throw error;
        }

        logAuthDebug("profile-phone", "send-otp:auto-retry", {
          reason: "duplicate-render",
        });
        resetRecaptcha("recaptcha-container");
        result = await sendOtp();
      }

      setConfirmationResult(result);
      setShowOtpInput(true);
      startResendCooldown();
      logAuthDebug("profile-phone", "send-otp:success");
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      logAuthDebug("profile-phone", "send-otp:error", {
        message: error?.message || "",
        code: error?.code || "",
      });
      resetRecaptcha("recaptcha-container");
      if (!isRecaptchaAlreadyRenderedError(error)) {
        toast.error(error.message || "Failed to send OTP");
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter specific 6-digit OTP");
      return;
    }

    try {
      setPhoneLoading(true);
      logAuthDebug("profile-phone", "verify-otp:start", {
        hasConfirmationResult: Boolean(confirmationResult),
      });
      // Attempt to confirm the OTP
      const userCredential = await confirmationResult?.confirm(otpString);
      const idToken = await userCredential?.user.getIdToken(true);

      if (idToken) {
        const verifyRes = await verifyIdToken(idToken);

        if (verifyRes.success) {
          logAuthDebug("profile-phone", "verify-otp:success");
          // If successful, the backend has linked/merged the accounts
          login(verifyRes.token, verifyRes.user);
          sessionStorage.removeItem(RESEND_AVAILABLE_AT_KEY);
          resetRecaptcha("recaptcha-container");
          setIsPhoneVerified(true);
          setShowOtpInput(false);
          toast.success(
            "Phone number verified and accounts merged successfully!",
          );

          // Small delay before reload to let the user see the success message
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          logAuthDebug("profile-phone", "verify-otp:backend-failed", {
            message: verifyRes.message || "",
          });
          toast.error(verifyRes.message || "Backend synchronization failed.");
        }
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      logAuthDebug("profile-phone", "verify-otp:error", {
        message: error?.message || "",
        code: error?.code || "",
      });
      if (
        error.code === "auth/credential-already-in-use" ||
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "This phone number is already associated with another account. However, we tried to merge them. Please try again or contact support if the issue persists.",
        );
      } else {
        toast.error(error.message || "Invalid OTP or verification failed.");
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- Email OTP Handlers ---

  const handleSendEmailOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setEmailLoading(true);
      const res = await sendEmailOtp(email);
      if (res.success) {
        setShowEmailOtpInput(true);
        toast.success("OTP sent to email successfully!");
      } else {
        toast.error(res.message || "Failed to send email OTP.");
      }
    } catch (error: any) {
      console.error("Error sending email OTP:", error);
      toast.error("Failed to send email OTP. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const otpString = emailOtp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter specific 6-digit OTP");
      return;
    }

    try {
      setEmailLoading(true);
      const res = await verifyEmailOtp(email, otpString);

      if (res.success && res.token) {
        const verifiedEmail = res.user?.email || email.trim().toLowerCase();
        const updatedUser = { ...res.user, email: verifiedEmail };
        login(res.token, updatedUser);
        updateUserDetailsInLocalStorage(updatedUser);
        setEmail(verifiedEmail);
        setIsEmailVerified(true);
        setShowEmailOtpInput(false);
        toast.success("Email verified successfully!");
      } else {
        toast.error(res.message || "Invalid OTP or verification failed.");
      }
    } catch (error: any) {
      console.error("Error verifying email OTP:", error);
      toast.error(error.message || "An error occurred during verification.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    if (value && index < 5) emailInputRefs.current[index + 1]?.focus();
  };

  const handleEmailKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !emailOtp[index] && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    }
  };

  // --------------------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setProfilePictureFile(null);
      if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview(null);
    }
  };

  const handleSave = async () => {
    const hasEnteredMobile = mobileNumber.trim().length > 0;

    if (hasEnteredMobile && !isPhoneVerified) {
      toast.error("Please verify your mobile number before saving.");
      return;
    }

    if (email && !isEmailVerified) {
      toast.error("Please verify your email address before saving.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      if (hasEnteredMobile) {
        formData.append("phoneNumber", mobileNumber);
      }
      formData.append("alternativeMobileNumber", alternativeMobileNumber);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("gender", gender);
      if (profilePictureFile) {
        formData.append("profilePicture", profilePictureFile);
      }

      const response = await updateUserProfile(formData);
      if (response.success) {
        setSuccess("Profile updated successfully!");
        if (response.data?.profilePicture) {
          setProfilePictureUrl(getApiImageUrl(response.data.profilePicture));
          setProfilePicturePreview(null);
          setProfilePictureFile(null);
        }
      } else {
        setError(response.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-20 w-160">
      <div className="pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold">Edit Profile</h3>
        <p className="text-sm">Update your profile details</p>
      </div>

      <div className="text-sm">
        {initialLoading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
          </div>
        )}
        {initialError && <p className="text-red-500">{initialError}</p>}

        {!initialLoading && !initialError && (
          <>
            <div className="flex items-center py-6 px-5 border border-gray-200 rounded-sm mt-3">
              <label className="w-56 text-gray-700">Profile Picture</label>
              <div className="flex items-center space-x-4">
                {(profilePicturePreview || profilePictureUrl) && (
                  <Image
                    src={profilePicturePreview || profilePictureUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm file:border file:border-gray-300 file:px-3 file:py-1 file:bg-white file:rounded file:text-gray-700"
                />
              </div>
            </div>

            {/* Mobile Number Section */}
            <div className="flex flex-col py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3 transition-colors">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col w-full">
                  <label className="w-56 text-gray-700 font-medium mb-1">
                    Mobile Number* 
                  </label>
                  {isPhoneVerified && !showOtpInput ? (
                    <div className="flex items-center">
                      <span className="text-gray-900 font-medium text-lg">
                        {mobileNumber}
                      </span>
                      <span className="ml-2 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold border border-green-200 flex items-center gap-1">
                        ✓ Verified
                      </span>
                      <button
                        onClick={() => {
                          setIsPhoneVerified(false);
                          setShowOtpInput(false);
                        }}
                        className="ml-auto text-xs text-[#8b6b2f] underline hover:text-[#7a5f29] cursor-pointer"
                      >
                        CHANGE
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 10) setMobileNumber(val);
                          }}
                          placeholder="Enter 10-digit number"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-[#8b6b2f] focus:outline-none"
                          disabled={showOtpInput}
                        />
                      </div>
                      {!showOtpInput && (
                        <button
                          onClick={handleSendOtp}
                          disabled={
                            phoneLoading ||
                            mobileNumber.length !== 10 ||
                            isPhoneVerified
                          }
                          className="bg-[#8b6b2f] cursor-pointer  text-white px-4 py-2 rounded text-xs font-bold tracking-wide hover:bg-[#7a5f29] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {phoneLoading ? "SENDING..." : "VERIFY"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* OTP Input Section */}
              {showOtpInput && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-gray-600 text-sm mb-3">
                    Enter the 6-digit code sent to +91 {mobileNumber}
                  </p>
                  <div className="flex gap-3 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-10 h-10 text-center text-lg border border-gray-300 rounded focus:border-[#8b6b2f] focus:ring-1 focus:ring-[#8b6b2f] outline-none transition-all"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerifyOtp}
                      disabled={phoneLoading}
                      className="bg-green-600 cursor-pointer text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-70"
                    >
                      {phoneLoading ? "VERIFYING..." : "CONFIRM OTP"}
                    </button>
                    <button
                      onClick={() => setShowOtpInput(false)}
                      className="text-gray-500 text-sm hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendOtp}
                      disabled={phoneLoading || resendCooldown > 0}
                      className="ml-auto text-[#8b6b2f] text-sm font-medium cursor-pointer hover:underline"
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : phoneLoading
                          ? "SENDING..."
                          : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}
              <div id="recaptcha-container"></div>
            </div>

            {/* Email Section */}
            <div className="flex flex-col py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3 transition-colors">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col w-full">
                  <label className="text-gray-700 font-medium mb-1">
                    Email*
                  </label>
                  {isEmailVerified && !showEmailOtpInput ? (
                    <div className="flex items-center">
                      <span className="text-gray-900 font-medium text-lg min-w-[200px] truncate">
                        {email}
                      </span>
                      <span className="ml-2 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold border border-green-200 flex items-center gap-1">
                        ✓ Verified
                      </span>
                      <button
                        onClick={() => {
                          setIsEmailVerified(false);
                          setShowEmailOtpInput(false);
                        }}
                        className="ml-auto text-xs text-[#8b6b2f] cursor-pointer underline hover:text-[#7a5f29] cursor-pointer"
                      >
                        CHANGE
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-sm">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#8b6b2f] focus:outline-none"
                          disabled={showEmailOtpInput}
                        />
                      </div>
                      {!showEmailOtpInput && (
                        <button
                          onClick={handleSendEmailOtp}
                          disabled={emailLoading || !email}
                          className="bg-[#8b6b2f] text-white cursor-pointer px-4 py-2 rounded text-xs font-bold tracking-wide hover:bg-[#7a5f29] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {emailLoading ? "SENDING..." : "VERIFY"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email OTP Input Section */}
              {showEmailOtpInput && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-gray-600 text-sm mb-3">
                    Enter the 6-digit code sent to {email}
                  </p>
                  <div className="flex gap-3 mb-4">
                    {emailOtp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          emailInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-10 h-10 text-center text-lg border border-gray-300 rounded focus:border-[#8b6b2f] focus:ring-1 focus:ring-[#8b6b2f] outline-none transition-all"
                        value={digit}
                        onChange={(e) =>
                          handleEmailOtpChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleEmailKeyDown(index, e)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerifyEmailOtp}
                      disabled={emailLoading}
                      className="bg-green-600 cursor-pointer text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-70"
                    >
                      {emailLoading ? "VERIFYING..." : "CONFIRM OTP"}
                    </button>
                    <button
                      onClick={() => setShowEmailOtpInput(false)}
                      className="text-gray-500 text-sm cursor-pointer hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmailOtp}
                      className="ml-auto text-[#8b6b2f] cursor-pointer text-sm font-medium hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Full Name */}
            <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
              <div className="flex flex-col w-full mr-4">
                <label className="text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#8b6b2f]"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setGender("Male")}
                  className={`px-4 py-2 border rounded text-sm transition-all cursor-pointer ${
                    gender === "Male"
                      ? "border-black bg-gray-50 font-semibold shadow-sm"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {gender === "Male" && "✓ "}Male
                </button>
                <button
                  onClick={() => setGender("Female")}
                  className={`px-4 py-2 border rounded text-sm transition-all cursor-pointer ${
                    gender === "Female"
                      ? "border-black bg-gray-50 font-semibold shadow-sm"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {gender === "Female" && "✓ "}Female
                </button>
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
              <div className="flex flex-col w-full">
                <label className="text-gray-700 mb-1">
                  Birthday (dd/mm/yyyy)*
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#8b6b2f]"
                />
              </div>
            </div>

            {/* Alternative Mobile */}
            <div className="py-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Alternative mobile details
              </h4>
              <div className="flex items-center gap-2 py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
                <span className="text-gray-700 font-medium">+91</span>
                <input
                  type="text"
                  value={alternativeMobileNumber}
                  onChange={(e) =>
                    setAlternativeMobileNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Mobile Number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="tel"
                  className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-[#8b6b2f]"
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-6">
          <button
            onClick={handleSave}
            className="w-full bg-[#8b6b2f] cursor-pointer hover:bg-[#7a5f29] text-white py-4 text-sm font-bold tracking-widest rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={
              loading ||
              (showOtpInput && !isPhoneVerified) ||
              (showEmailOtpInput && !isEmailVerified)
            }
          >
            {loading ? "SAVING..." : "SAVE DETAILS"}
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm mt-2 text-center">{success}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
