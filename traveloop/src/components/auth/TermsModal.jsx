import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import TermsContent from "./TermsContent";

const PrivacyContent = () => (
  <div className="space-y-6 text-slate-600 dark:text-slate-350 text-sm leading-relaxed">
    <p className="font-medium">
      <strong>Last Updated:</strong> June 2026
    </p>
    <p>
      Welcome to <strong>Traveloop</strong>. Your privacy is of paramount importance to us. This Privacy Policy documents how we collect, use, and process your profile credentials and travel details.
    </p>
    <section>
      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">1. Information We Collect</h2>
      <p>
        We collect profile information when you register, such as your email, first name, last name, and preferences. If you connect via Google Authentication, we retrieve your Google email, profile ID, and avatar image. We also save your created trip details, checklists, budgets, notes, and saved destinations.
      </p>
    </section>
    <section>
      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">2. How We Use Information</h2>
      <p>
        Your information is used solely to provide core service features: organizing itineraries, calculating trip budget allocations, saving preferences, sync’ing weather warnings, and displaying profile details.
      </p>
    </section>
    <section>
      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">3. Data Retention and Deletion</h2>
      <p>
        We store data for as long as your account is active. In accordance with Play Store policy, you can trigger a permanent account deletion from your Profile settings at any time, which completely wipes all personal profile details and associated trips from our databases.
      </p>
    </section>
    <section>
      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">4. Third Party Integrations</h2>
      <p>
        We connect to Google Maps APIs for autocomplete predictions and coordinate lookups, and Open-Meteo for live weather alerts. These integrations do not receive your personal account details.
      </p>
    </section>
    <section>
      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">5. Security</h2>
      <p>
        We encrypt passwords using bcrypt and issue secure JWT credentials for protected route sessions.
      </p>
    </section>
    <p className="text-xs text-slate-400 pt-4 text-center border-t border-slate-100 dark:border-slate-800">
      For questions regarding privacy, contact support at privacy@traveloop.com
    </p>
  </div>
);

const TermsModal = ({ isOpen, onClose, section = "terms" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {section === "terms" ? "Terms & Conditions" : "Privacy Policy"}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  Last updated: June 2026
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {section === "terms" ? <TermsContent /> : <PrivacyContent />}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-xs"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
