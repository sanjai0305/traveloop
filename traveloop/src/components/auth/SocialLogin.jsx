// src/components/auth/SocialLogin.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApiUrl } from "../../utils/api";

// Timeout for backend token exchange (ms)
const GOOGLE_AUTH_TIMEOUT_MS = 15000;

const SocialLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  // Guard to prevent GSI double-initialization (StrictMode / re-mount)
  const gsiInitializedRef = useRef(false);

  useEffect(() => {
    if (window.Capacitor) {
      setIsCapacitor(true);
      // Initialize Capacitor Google Auth
      import("@codetrix-studio/capacitor-google-auth")
        .then(({ GoogleAuth }) => {
          GoogleAuth.initialize({
            clientId:
              import.meta.env.VITE_GOOGLE_CLIENT_ID ||
              "335198086054-googleclientid.apps.googleusercontent.com",
            scopes: ["profile", "email"],
            grantOfflineAccess: true,
          }).catch((err) =>
            console.warn("[SocialLogin] Capacitor GoogleAuth init error:", err)
          );
        })
        .catch((err) =>
          console.error("[SocialLogin] Failed to import Capacitor GoogleAuth:", err)
        );
      return;
    }

    // Web GSI path
    const initGsi = () => {
      if (gsiInitializedRef.current) {
        console.log("[SocialLogin] GSI already initialized — skipping duplicate init.");
        return;
      }

      if (!window.google) {
        console.warn("[SocialLogin] window.google not available yet.");
        return;
      }

      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        "335198086054-googleclientid.apps.googleusercontent.com";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const btnEl = document.getElementById("google-signin-btn");
      if (btnEl) {
        window.google.accounts.id.renderButton(btnEl, {
          theme: "outline",
          size: "large",
          width: "350",
          text: "continue_with",
          shape: "rectangular",
        });
      }

      gsiInitializedRef.current = true;
      console.log("[SocialLogin] GSI initialized successfully.");
    };

    if (window.google) {
      initGsi();
      return;
    }

    // Check if script is already injected to avoid duplicates
    if (document.getElementById("google-gsi-script")) {
      // Script tag exists but google may not be ready yet — wait for load
      const existingScript = document.getElementById("google-gsi-script");
      existingScript.addEventListener("load", initGsi);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    script.onerror = () => {
      console.error("[SocialLogin] Failed to load Google GSI script.");
    };
    document.head.appendChild(script);
  }, []);

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      console.error("[SocialLogin] GSI callback received no credential.");
      return;
    }
    console.log("[GoogleAuth Audit] GSI credential received.");
    await sendTokenToBackend(response.credential);
  };

  const sendTokenToBackend = async (idToken) => {
    setLoading(true);

    // AbortController for timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error("[GoogleAuth Audit] Backend request timed out after", GOOGLE_AUTH_TIMEOUT_MS, "ms");
    }, GOOGLE_AUTH_TIMEOUT_MS);

    try {
      const url = getApiUrl("auth/google");
      console.log("[GoogleAuth Audit] Sending token to backend:", url);
      console.log("[GoogleAuth Audit] idToken present:", !!idToken);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      });

      console.log("[GoogleAuth Audit] Backend response status:", res.status);
      const data = await res.json();
      console.log("[GoogleAuth Audit] Backend response body:", data);

      if (!res.ok) {
        console.error("[GoogleAuth Audit] Google auth backend error:", data.message);
        // Show error inline — avoid alert() on mobile
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: data.message || "Google Sign-In failed. Please try again.",
          })
        );
        return;
      }

      // Commit auth state (synchronous)
      login(data.user, data.token);
      console.log("[GoogleAuth Audit] Login successful. Navigating to dashboard.");
      navigate("/dashboard", { replace: true });

    } catch (err) {
      if (err.name === "AbortError") {
        console.error("[GoogleAuth Audit] Request aborted (timeout).");
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Google Sign-In timed out. Please try again.",
          })
        );
      } else {
        console.error("[GoogleAuth Audit] Unexpected error:", err.message, err);
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Sign-In connection error. Please check your internet.",
          })
        );
      }
    } finally {
      // ALWAYS reset loading — no matter success or failure
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleNativeSignIn = async () => {
    setLoading(true);

    try {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      console.log("[GoogleAuth Audit] Starting native Google Sign-In...");

      const user = await GoogleAuth.signIn();
      console.log("[GoogleAuth Audit] Native sign-in user received:", user?.email);

      if (user && user.authentication && user.authentication.idToken) {
        // sendTokenToBackend manages its own loading state and finally block
        await sendTokenToBackend(user.authentication.idToken);
      } else {
        console.warn("[GoogleAuth Audit] Native sign-in: No idToken in user object.", user);
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Google Sign-In did not return a valid token. Please try again.",
          })
        );
      }
    } catch (err) {
      if (err.message && err.message.includes("cancelled")) {
        // User dismissed the Google sign-in dialog — not an error
        console.log("[GoogleAuth Audit] Native sign-in cancelled by user.");
      } else {
        console.error("[GoogleAuth Audit] Native Google Sign-In error:", err.message, err);
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Google Sign-In failed. Please try again.",
          })
        );
      }
    } finally {
      // Ensure loading resets if sendTokenToBackend wasn't reached
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-2.5">
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-3" aria-live="polite">
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 animate-spin rounded-full" />
          <p className="text-slate-500 text-xs font-semibold">Signing in with Google...</p>
        </div>
      ) : isCapacitor ? (
        <button
          onClick={handleNativeSignIn}
          className="w-full max-w-[350px] flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.79 2.94C6.18 7.55 8.87 5.04 12 5.04z"/>
             <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.57v2.96h3.87c2.26-2.09 3.55-5.17 3.55-8.68z"/>
             <path fill="#FBBC05" d="M5.21 10.48c-.25-.75-.39-1.56-.39-2.39 0-.83.14-1.64.39-2.39L1.42 2.76C.51 4.57 0 6.62 0 8.79s.51 4.22 1.42 6.03l3.79-2.94z"/>
             <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.87-2.96c-1.08.72-2.45 1.16-4.09 1.16-3.13 0-5.82-2.51-6.79-5.44l-3.79 2.94C3.37 20.35 7.35 23 12 23z"/>
          </svg>
          Continue with Google
        </button>
      ) : (
        <div id="google-signin-btn" className="w-full max-w-[350px] flex justify-center min-h-[44px]" />
      )}
    </div>
  );
};

export default SocialLogin;