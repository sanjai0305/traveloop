// src/utils/api.js

import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

const getApiBaseUrl = () => {
  // If we are in development mode, resolve to local backend IP/host
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "10.0.2.2";
    const isLocalIp = hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");

    if (isLocalHost || isLocalIp) {
      if (isNative && (hostname === "localhost" || hostname === "127.0.0.1")) {
        return "http://10.0.2.2:5000/api";
      }
      return `http://${hostname}:5000/api`;
    }
  }

  // Production or fallback
  return "https://traveloop-751k.vercel.app/api";
};

const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// GLOBAL FETCH INTERCEPTOR FOR RETRY LOGIC & JWT EXPIRATION
const originalFetch = window.fetch;

window.fetch = async function (url, options = {}) {
  if (!navigator.onLine) {
    const method = (options.method || "GET").toUpperCase();

    if (
      method === "POST" ||
      method === "PUT" ||
      method === "DELETE"
    ) {
      alert(
        "Save operations are disabled while offline. Please connect to the internet."
      );

      throw new Error(
        "Save operations are disabled while offline. Please connect to the internet."
      );
    }
  }

  const retries = 3;
  const initialDelay = 1000;

  let activeRequest = url;

  const executeFetch = async (attempt) => {
    try {
      let requestParam;
      if (activeRequest instanceof Request) {
        requestParam = activeRequest;
        activeRequest = activeRequest.clone();
      } else {
        requestParam = activeRequest;
      }
      const response = await originalFetch(requestParam, options);

      // Handle Session Expirations (401 only)
      if (response.status === 401) {
        const urlStr =
          typeof url === "string"
            ? url
            : url instanceof Request
            ? url.url
            : "";

        const isAuthRoute =
          urlStr.includes("/auth/login") ||
          urlStr.includes("/auth/register") ||
          urlStr.includes("/auth/google");

        if (!isAuthRoute) {
          const protectedPaths = [
            "/dashboard",
            "/my-trips",
            "/create-trip",
            "/build-itinerary",
            "/packing-checklist",
            "/trip-notes",
            "/activities",
            "/profile",
            "/trip-budget",
            "/saved-destinations",
          ];

          const currentPath = window.location.pathname;

          if (
            protectedPaths.some((path) =>
              currentPath.startsWith(path)
            )
          ) {
            console.warn(
              "[API] JWT token invalid or expired (status:", response.status, "). Dispatching auth:expired."
            );
            // Dispatch custom event — AuthContext listener calls logout() + React Router navigates cleanly
            // This avoids the blank-screen flash from window.location.href hard reload
            window.dispatchEvent(new CustomEvent("auth:expired"));
          }
        }
      }

      // Retry on 5xx errors
      if (
        !response.ok &&
        response.status >= 500 &&
        attempt < retries
      ) {
        const backoffDelay =
          initialDelay * Math.pow(2, attempt);

        console.warn(
          `Fetch to ${url} failed with status ${response.status}. Retrying in ${backoffDelay}ms...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, backoffDelay)
        );

        return executeFetch(attempt + 1);
      }

      return response;
    } catch (err) {
      if (attempt < retries) {
        const backoffDelay =
          initialDelay * Math.pow(2, attempt);

        console.warn(
          `Fetch to ${url} failed with error: ${err.message}. Retrying in ${backoffDelay}ms...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, backoffDelay)
        );

        return executeFetch(attempt + 1);
      }

      throw err;
    }
  };

  return executeFetch(0);
};

export default API_BASE_URL;