// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getApiUrl } from "../utils/api";
import { onAuthStateChanged, signOut as fbSignOut, signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Ref to ensure we only finalize startup once (prevents double-fire from onAuthStateChanged)
  const initializedRef = useRef(false);

  // ─── CLEAN LOGOUT (internal helper) ───────────────────────────────────────
  const performLogout = () => {
    fbSignOut(auth).catch((err) => console.warn("[Auth] Firebase SignOut error:", err));
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setFirebaseUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ─── STARTUP AUTH INITIALIZATION ──────────────────────────────────────────
  useEffect(() => {
    let unsubscribe = null;

    // Safety timeout: if Firebase never fires onAuthStateChanged (offline / cold start),
    // release the loading gate after 6 seconds so the app is never permanently stuck.
    const safetyTimer = setTimeout(() => {
      if (!initializedRef.current) {
        console.warn("[Auth] onAuthStateChanged never fired. Releasing loading gate via safety timeout.");

        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log("[Auth] Safety timeout: restored session from localStorage.");
            
            // Re-introduce background anonymous sign in if no firebase user
            if (!auth.currentUser) {
              signInAnonymously(auth).catch((err) => {
                console.error("[Auth] Safety timeout background anonymous sign in failed:", err);
              });
            }
          } catch (e) {
            console.error("[Auth] Safety timeout: failed to parse cached user.", e);
            performLogout();
          }
        } else {
          setIsAuthenticated(false);
        }

        initializedRef.current = true;
        setLoading(false);
        setIsInitialized(true);
      }
    }, 6000);

    const initAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        // If safety timeout already resolved, ignore subsequent Firebase events
        if (initializedRef.current) {
          return;
        }

        try {
          if (fbUser && !fbUser.isAnonymous) {
            // ── FIREBASE USER IS AUTHENTICATED (Google SSO path) ──────────────
            if (storedToken && storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser({
                  ...parsedUser,
                  uid: fbUser.uid,
                  displayName:
                    fbUser.displayName ||
                    `${parsedUser.firstName} ${parsedUser.lastName}`,
                  email: fbUser.email || parsedUser.email,
                  photoURL: fbUser.photoURL || parsedUser.avatar,
                });
                setToken(storedToken);
                setIsAuthenticated(true);

                // Server-side verify the stored JWT even on Google sessions
                verifyTokenInBackground(storedToken);
              } catch (e) {
                console.error("[Auth] Failed to parse cached user data:", e);
                performLogout();
              }
            } else {
              // Firebase has a user but no local JWT — sign out of Firebase cleanly
              console.warn("[Auth] Firebase user without matching JWT. Signing out Firebase.");
              fbSignOut(auth).catch(() => {});
              setIsAuthenticated(false);
            }
          } else {
            // ── NO FIREBASE USER (email/password JWT path or logged out) ──────
            if (storedToken && storedUser) {
              // Restore from localStorage without touching Firebase auth
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                setIsAuthenticated(true);
                console.log("[Auth] Restored JWT session from localStorage.");

                // Verify token with backend in the background
                verifyTokenInBackground(storedToken);

                // Re-introduce background anonymous sign in if no firebase user
                if (!fbUser) {
                  signInAnonymously(auth).catch((err) => {
                    console.error("[Auth] Startup background anonymous sign in failed:", err);
                  });
                }
              } catch (e) {
                console.error("[Auth] Failed to parse stored user:", e);
                performLogout();
              }
            } else {
              setIsAuthenticated(false);
            }
          }
        } catch (unexpectedError) {
          console.error("[Auth] Unexpected error during auth initialization:", unexpectedError);
          performLogout();
        } finally {
          initializedRef.current = true;
          clearTimeout(safetyTimer);
          setLoading(false);
          setIsInitialized(true);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // ─── LISTEN FOR auth:expired EVENT (dispatched by fetch interceptor) ──────
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn("[Auth] auth:expired event received. Forcing logout.");
      performLogout();
    };
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  // ─── BACKGROUND TOKEN VERIFICATION ────────────────────────────────────────
  // Verifies stored JWT with backend silently. Forces logout on 401/404.
  // Does NOT block startup — runs after loading is already released.
  const verifyTokenInBackground = async (storedToken) => {
    try {
      const res = await fetch(getApiUrl("auth/me"), {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        console.warn("[Auth] Background token verification failed (status:", res.status, "). Logging out.");
        performLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("[Auth] Background token verified. User refreshed.");
        }
      }
    } catch (err) {
      // Network failure — keep cached session, do not force logout
      console.warn("[Auth] Background token verification network error (offline?). Keeping cache:", err.message);
    }
  };

  // ─── REFRESH USER DATA ────────────────────────────────────────────────────
  const refreshUserData = async () => {
    const storedToken = localStorage.getItem("token") || token;
    if (!storedToken) return null;

    try {
      const res = await fetch(getApiUrl("auth/me"), {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("[Auth] refreshUserData: token rejected (status:", res.status, "). Logging out.");
        performLogout();
        return null;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent("userUpdated", { detail: data.user }));
          return data.user;
        }
      }

      return null;
    } catch (err) {
      console.error("[Auth] refreshUserData failed (network error):", err);
      return null;
    }
  };

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = (userData, userToken) => {
    // Synchronous — state is committed immediately.
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("[Auth] handleLogin: session committed for", userData.email);

    // Sign in to Firebase anonymously in the background if not already signed in
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.error("[Auth] Login background anonymous sign in failed:", err);
      });
    }
  };

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    performLogout();
  };

  // ─── UPDATE USER ───────────────────────────────────────────────────────────
  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        isInitialized,
        firebaseUser,
        login: handleLogin,
        logout: handleLogout,
        updateUser: handleUpdateUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
