import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { sendOtpCode } from "../../services/authService";
import TermsModal from "./TermsModal";
import Checkbox from "../common/Checkbox";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Load initial form data from sessionStorage
  const [formData, setFormData] = useState(() => {
    try {
      const cached = sessionStorage.getItem("traveloop_register_form");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          city: parsed.city || "",
          country: parsed.country || "India",
          password: "",
        };
      }
    } catch (e) {
      console.warn("Failed to parse cached register form data:", e);
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      country: "India",
      password: "",
    };
  });

  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsModal, setTermsModal] = useState({ open: false, section: "terms" });

  useEffect(() => {
    // Save to sessionStorage (excluding password for security)
    const { password, ...rest } = formData;
    sessionStorage.setItem("traveloop_register_form", JSON.stringify(rest));
  }, [formData]);

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "", text: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500", text: "text-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    return { score, label: "Strong", color: "bg-teal-500", text: "text-teal-500" };
  };

  const strength = getPasswordStrength(formData.password);

  // VALIDATION
  const validateForm = () => {
    let newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(formData.email.trim().toLowerCase())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      const cleanedPhone = formData.phone.trim().replace(/[\s\-().]/g, "");
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = "Please enter a valid phone number (7-15 digits, numeric)";
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else {
      const pwdStrength = getPasswordStrength(formData.password);
      if (pwdStrength.score < 4) {
        newErrors.password = "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number";
      }
    }

    if (!agree) {
      newErrors.agree = "You must agree to the Terms & Conditions and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // REGISTER & SEND OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await sendOtpCode({
        ...formData,
        acceptedTerms: agree,
        termsVersion: "2026-06",
      });

      // Navigate to verification screen, passing full registration details in state
      navigate("/verify-email", {
        state: {
          formData: {
            ...formData,
            acceptedTerms: agree,
            termsVersion: "2026-06",
          },
        },
      });
    } catch (error) {
      console.error("[RegisterForm] OTP send error:", error);
      setErrors({ general: error.message || "Failed to send verification code. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* GENERAL ERROR */}
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First Name"
          type="text"
          name="firstName"
          placeholder="Enter your first name"
          icon={User}
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          required
        />

        <InputField
          label="Last Name"
          type="text"
          name="lastName"
          placeholder="Enter your last name"
          icon={User}
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          required
        />
      </div>

      <InputField
        label="Email Address"
        type="email"
        name="email"
        placeholder="Enter your email address"
        icon={Mail}
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <InputField
        label="Phone Number"
        type="text"
        name="phone"
        placeholder="Enter your phone number"
        icon={Phone}
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="City"
          type="text"
          name="city"
          placeholder="Enter your city"
          icon={MapPin}
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
          required
        />

        <InputField
          label="Country"
          type="text"
          name="country"
          placeholder="Enter your country"
          icon={Globe}
          value={formData.country}
          onChange={handleChange}
          error={errors.country}
          required
        />
      </div>

      <div className="relative">
        <InputField
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        {/* PASSWORD STRENGTH VISUAL FEEDBACK */}
        {formData.password && (
          <div className="mt-1.5 space-y-1 animate-fade-in">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Password Strength:</span>
              <span className={`font-bold transition-colors duration-300 ${strength.text}`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 transition-all duration-500 ${
                    step <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
            {strength.score < 4 && (
              <ul className="text-[11px] text-slate-400 space-y-0.5 mt-0.5 list-disc pl-4">
                <li className={formData.password.length >= 8 ? "text-teal-600 font-semibold" : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                  At least one uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                  At least one lowercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                  At least one number
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* TERMS & CONDITIONS CHECKBOX */}
      <Checkbox
        id="agree-checkbox"
        checked={agree}
        onChange={(e) => {
          setAgree(e.target.checked);
          setErrors((prev) => ({ ...prev, agree: "" }));
        }}
        error={errors.agree}
        label={
          <span className="text-slate-600 dark:text-slate-400">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setTermsModal({ open: true, section: "terms" })}
              className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline"
            >
              Terms & Conditions
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setTermsModal({ open: true, section: "privacy" })}
              className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline"
            >
              Privacy Policy
            </button>
          </span>
        }
      />

      <Button
        type="submit"
        text="Create Account"
        loading={loading}
        disabled={!agree}
        icon={ShieldCheck}
      />

      {/* TERMS MODAL */}
      <TermsModal
        isOpen={termsModal.open}
        onClose={() => setTermsModal({ ...termsModal, open: false })}
        onAccept={() => {
          setAgree(true);
          setErrors((prev) => ({ ...prev, agree: "" }));
        }}
        section={termsModal.section}
      />
    </form>
  );
};

export default RegisterForm;