import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, MailCheck } from "lucide-react";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";

const ForgotPasswordForm = () => {
  const { sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email format regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("[ForgotPassword] Error sending password reset:", err);
      setError(err.message || "Failed to send reset email. Please ensure the email is registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* SUCCESS BANNER */}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600 font-medium">
          A password reset link has been sent to your email address. Please check your inbox and spam folder.
        </div>
      )}

      {/* EMAIL FIELD */}
      <InputField
        label="Email Address"
        type="email"
        name="email"
        placeholder="Enter your registered email"
        icon={User}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        error={error}
        disabled={loading}
        required
      />

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        text="Send Reset Link"
        loading={loading}
        icon={MailCheck}
      />

      {/* BACK TO LOGIN */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
