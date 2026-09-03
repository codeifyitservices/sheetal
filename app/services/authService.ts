import Cookies from "js-cookie";
import { apiFetch } from "./api";

export const TOKEN_KEY = "token";
const USER_KEY = "user_details";
export const AUTH_UPDATED_EVENT = "auth-state-changed";

interface User {
  id: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  role: string;
  status?: string;
  alternativeMobileNumber?: string;
  gender?: "Male" | "Female";
  dateOfBirth?: string;
  profilePicture?: string;
}

interface VerifyTokenResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export const verifyIdToken = async (
  idToken: string,
): Promise<VerifyTokenResponse> => {
  const currentToken = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };

  if (currentToken) {
    headers["X-Session-Token"] = currentToken;
  }

  return apiFetch("/client/auth/verify-id-token", {
    method: "POST",
    headers,
  });
};

export const sendEmailOtp = async (email: string) => {
  return apiFetch("/client/auth/send-email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const verifyEmailOtp = async (email: string, otp: string) => {
  const currentToken = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }

  return apiFetch("/client/auth/verify-email-otp", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, otp }),
  });
};

export const isTokenExpired = (token?: string): boolean => {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const decoded = JSON.parse(jsonPayload);
    if (typeof decoded.exp !== "number") return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

export const isAuthExpiredError = (
  message?: string,
  status?: number,
): boolean => {
  if (status === 401) return true;
  const msg = String(message || "").toLowerCase();
  return (
    msg.includes("token") ||
    msg.includes("jwt") ||
    msg.includes("expired") ||
    msg.includes("unauthorized") ||
    msg.includes("login required") ||
    msg.includes("not logged") ||
    msg.includes("invalid token")
  );
};

export const login = (token: string, user: User) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  }
};

export const logout = () => {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  }
};

export const getToken = (): string | undefined => {
  const cookieToken = Cookies.get(TOKEN_KEY);
  const localToken =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY) || undefined
      : undefined;

  const token = cookieToken || localToken;
  if (!token) {
    return undefined;
  }

  if (isTokenExpired(token)) {
    logout();
    return undefined;
  }

  return token;
};

export const getUserDetails = (): User | null => {
  if (typeof window === "undefined") {
    // Check if running on client side
    return null;
  }
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson) as User;
    // Safety mapping: Ensure id exists if _id was stored instead
    if (!user.id && (user as any)._id) {
      user.id = (user as any)._id;
    }
    return user;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return Boolean(getToken());
};

export const updateUserDetailsInLocalStorage = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
