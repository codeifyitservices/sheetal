import { logout, isTokenExpired, isAuthExpiredError } from "./authService";
import { storeRedirectTarget } from "../utils/authRedirect";

/**
 * Central API configuration and base fetcher
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE_URL = `${BASE_URL}/api/v1`;

export const handleResponse = async (res: Response) => {
  try {
    const data = await res.json();
    return data;
  } catch {
    return { success: false, message: res.statusText || "Request failed" };
  }
};

/**
 * Common fetcher to be used across all services.
 * Automatically adds the Authorization header if a token is present in cookies.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("token") ||
        document.cookie
          .split("; ")
          .find((part) => part.startsWith("token="))
          ?.split("=")[1]
      : undefined;

  const requestHeaders: Record<string, string> = {};

  // Initialize with default Content-Type if not provided and not FormData
  if (!(options.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Merge existing headers from options
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        requestHeaders[key] = value;
      });
    } else {
      // Assume Record<string, string>
      Object.assign(requestHeaders, options.headers);
    }
  }

  if (token) {
    if (isTokenExpired(token)) {
      logout();
      if (typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/otp")
        ) {
          storeRedirectTarget(currentPath);
          window.location.href = "/login";
        }
      }
      return { success: false, unauthorized: true, message: "" };
    }

    if (!requestHeaders["Authorization"]) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const method = (options.method || "GET").toUpperCase();
  const resolvedCache = options.cache ?? (method === "GET" ? "no-store" : undefined);

  const res = await fetch(url, {
    ...options,
    cache: resolvedCache,
    headers: requestHeaders,
  });

  if (res.status === 401) {
    logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/otp")
      ) {
        storeRedirectTarget(currentPath);
        window.location.href = "/login";
      }
    }
    return { success: false, unauthorized: true, message: "" };
  }

  const data = await handleResponse(res);
  if (
    data &&
    data.success === false &&
    isAuthExpiredError(data.message, res.status)
  ) {
    logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/otp")
      ) {
        storeRedirectTarget(currentPath);
        window.location.href = "/login";
      }
    }
    return { ...data, unauthorized: true, message: "" };
  }

  return data;
};

/**
 * Helper to resolve API image URLs.
 * Handles both string paths and objects with a 'url' property.
 */
export const getApiImageUrl = (
  path: any,
  fallback: string = "/assets/default-image.png",
): string => {
  if (!path) return fallback;
  const value = typeof path === "string" ? path : path.url;
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value.replace(/^\/+/, "")}`;
};
