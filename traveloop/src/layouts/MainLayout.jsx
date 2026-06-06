// src/layouts/MainLayout.jsx

import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import MobileAppBar from "../components/mobile/MobileAppBar";
import BottomNavBar from "../components/mobile/BottomNavBar";

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* TOP BAR */}
      <MobileAppBar />

      {/* PAGE CONTENT */}
      <main
        className="flex-1 w-full max-w-lg mx-auto overflow-y-auto overflow-x-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              paddingBottom: "calc(var(--bottom-nav-height, 80px) + max(env(safe-area-inset-bottom), 12px) + 28px)",
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FLOATING BOTTOM NAV */}
      <BottomNavBar />
    </div>
  );
};

export default MainLayout;