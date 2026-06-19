// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const RECAPTCHA_ALREADY_RENDERED_MESSAGE =
  "reCAPTCHA has already been rendered in this element";
const AUTH_DEBUG_KEY = "__auth_recaptcha_debug__";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
googleProvider.addScope("email");
googleProvider.addScope("profile");

const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: "popup",
});
facebookProvider.addScope("email");
facebookProvider.addScope("public_profile");

const clearRecaptchaContainer = (containerId: string) => {
  if (typeof window === "undefined") return;

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }
};

const getErrorDetails = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return {
      message: String(error || ""),
      code: "",
      name: "",
    };
  }

  const candidate = error as {
    message?: string;
    code?: string;
    name?: string;
  };

  return {
    message: candidate.message || "",
    code: candidate.code || "",
    name: candidate.name || "",
  };
};

export const isRecaptchaAlreadyRenderedError = (error: unknown) =>
  getErrorDetails(error).message.includes(RECAPTCHA_ALREADY_RENDERED_MESSAGE);

export const logAuthDebug = (
  scope: string,
  step: string,
  details?: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV !== "development") return;

  const payload = {
    scope,
    step,
    details: details || {},
    timestamp: new Date().toISOString(),
  };

  if (typeof window === "undefined") return;

  try {
    const existing = JSON.parse(
      sessionStorage.getItem(AUTH_DEBUG_KEY) || "[]",
    ) as Array<Record<string, unknown>>;
    existing.push(payload);
    sessionStorage.setItem(
      AUTH_DEBUG_KEY,
      JSON.stringify(existing.slice(-40)),
    );
  } catch {
    // Ignore sessionStorage failures in diagnostics.
  }
};

export const resetRecaptcha = (containerId: string) => {
  if (typeof window === "undefined") return;

  logAuthDebug("recaptcha", "reset:start", { containerId });

  const recaptchaWindow = window as Window & {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
    grecaptcha?: { reset: (widgetId?: number) => void };
  };

  try {
    // 1. Try to reset the widget via grecaptcha
    if (typeof recaptchaWindow.recaptchaWidgetId === "number") {
      recaptchaWindow.grecaptcha?.reset(recaptchaWindow.recaptchaWidgetId);
    } else {
      recaptchaWindow.grecaptcha?.reset?.();
    }
  } catch (err) {
    // Ignore reset failures; the widget will be recreated if needed.
  }

  try {
    // 2. Clear the verifier instance
    if (recaptchaWindow.recaptchaVerifier) {
      recaptchaWindow.recaptchaVerifier.clear();
    }
  } catch (err) {
    // Ignore verifier clear failures; references are nulled below.
  }

  // 3. Nullify all references
  recaptchaWindow.recaptchaVerifier = undefined;
  recaptchaWindow.recaptchaWidgetId = undefined;

  // 4. Force clear the DOM element to prevent re-render errors
  const container = document.getElementById(containerId);
  if (container) {
    // Remove all children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    // Also reset any attributes Firebase might have added
    container.innerHTML = "";
  }
  
  logAuthDebug("recaptcha", "reset:done", { containerId });
};

export const setupInvisibleRecaptcha = async (containerId: string) => {
  const recaptchaWindow = window as Window & {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  };

  const createVerifier = async () => {
    logAuthDebug("recaptcha", "setup:create", { containerId });
    resetRecaptcha(containerId);

    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        resetRecaptcha(containerId);
      },
    });

    recaptchaWindow.recaptchaVerifier = recaptchaVerifier;
    recaptchaWindow.recaptchaWidgetId = await recaptchaVerifier.render();
    logAuthDebug("recaptcha", "setup:rendered", {
      containerId,
      widgetId: recaptchaWindow.recaptchaWidgetId,
    });

    return recaptchaVerifier;
  };

  try {
    return await createVerifier();
  } catch (error) {
    const { message, code, name } = getErrorDetails(error);
    logAuthDebug("recaptcha", "setup:error", {
      containerId,
      message,
      code,
      name,
    });

    if (message.includes(RECAPTCHA_ALREADY_RENDERED_MESSAGE)) {
      resetRecaptcha(containerId);
      logAuthDebug("recaptcha", "setup:retry-after-duplicate-render", {
        containerId,
      });
      return createVerifier();
    }

    throw error;
  }
};

export {
  auth,
  googleProvider,
  facebookProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  type ConfirmationResult,
};