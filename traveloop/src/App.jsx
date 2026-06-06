import React, { useEffect } from "react";

// ROUTES
import AppRoutes from "./routes/AppRoutes";

// GLOBAL STYLES
import "./styles/global.css";

// TOAST PROVIDER
import ToastProvider from "./components/mobile/MobileToast";

// AUTH PROVIDER
import { AuthProvider } from "./context/AuthContext";

// THEME PROVIDER
import { ThemeProvider } from "./context/ThemeContext";

// ERROR BOUNDARY & OFFLINE INDICATOR
import ErrorBoundary from "./components/common/ErrorBoundary";
import OfflineIndicator from "./components/common/OfflineIndicator";

const App = () => {
  useEffect(() => {
    const handleFocusIn = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        const path = window.location.pathname;
        const formPaths = [
          "/create-trip",
          "/profile",
          "/build-itinerary",
          "/trip-budget",
          "/trip-notes",
          "/packing-checklist"
        ];
        const isFormScreen = formPaths.some(p => path.startsWith(p));
        if (isFormScreen) {
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <OfflineIndicator />
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;