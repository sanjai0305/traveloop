import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { registerWithEmailPassword, sendOtpCode, verifyOtpCode } from "../services/authService";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const formData = location.state?.formData;
  
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Timer for Resend OTP (30 seconds cooldown)
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  
  const inputRefs = useRef([]);

  // Redirect if accessed directly without form data
  useEffect(() => {
    if (!formData || !formData.email) {
      navigate("/register", { replace: true });
    }
  }, [formData, navigate]);

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      
      // If current is empty, clear previous and focus previous
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        // Just clear current
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setError("");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const pasteOtp = data.split("");
      setOtp(pasteOtp);
      inputRefs.current[5].focus();
      setError("");
    }
  };

  // Submit Handler
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Verify OTP with backend and get verified token
      const verifyRes = await verifyOtpCode(formData.email, otpCode);
      const otpToken = verifyRes.otpToken;

      setSuccess("Email verified! Finalizing registration...");

      // 2. Perform account creation in Firebase & Backend (in authService)
      const data = await registerWithEmailPassword(formData, otpToken);

      // 3. Clear session storage cache
      sessionStorage.removeItem("traveloop_register_form");

      // 4. Log in globally in the App
      login(data.user, data.token);

      // 5. Success navigation
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[VerifyEmail] Verification error:", err);
      setError(err.message || "Invalid code. Please verify the code and try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  // Resend Handler
  const handleResend = async () => {
    if (isResendDisabled) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendOtpCode(formData);
      setSuccess("A new verification code has been sent to your email.");
      setOtp(new Array(6).fill(""));
      setResendTimer(30);
      setIsResendDisabled(true);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto pt-4 text-center">
        {/* ICON */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/35 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-500 animate-pulse">
            <Mail size={28} />
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
          Verify Your Email
        </h2>

        {/* SUBTITLE */}
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          We sent a verification code to:
          <br />
          <span className="font-bold text-teal-600 dark:text-teal-400 break-all">
            {formData.email}
          </span>
        </p>

        {/* FORM */}
        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          {/* GENERAL ERROR */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-4 py-3 text-xs md:text-sm text-red-600 dark:text-red-400 font-semibold text-left">
              {error}
            </div>
          )}

          {/* GENERAL SUCCESS */}
          {success && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-4 py-3 text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-semibold text-left">
              {success}
            </div>
          )}

          {/* OTP INPUT BOXES */}
          <div className="flex justify-center gap-2 sm:gap-3 direction-ltr" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-950/45 transition-all shadow-inner"
              />
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Please check your spam or promotions folder if you don't see it in your inbox.
          </p>

          {/* BUTTONS */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              text="Verify OTP"
              loading={loading}
              icon={ShieldCheck}
            />

            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 ${
                isResendDisabled
                  ? "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98]"
              }`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {isResendDisabled ? `Resend Code (${resendTimer}s)` : "Resend Code"}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
