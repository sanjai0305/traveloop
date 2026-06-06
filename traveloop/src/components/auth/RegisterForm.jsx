import React, { useState } from "react";

import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import InputField from "../common/InputField";
import Button from "../common/Button";
import { getApiUrl } from "../../utils/api";

const RegisterForm = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "India",
    additionalInfo: "",
    password: "",
  });

  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);



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



  // VALIDATION
  const validateForm = () => {

    let newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName =
        "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName =
        "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email =
        "Email is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required";
    }

    if (!formData.city.trim()) {
      newErrors.city =
        "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country =
        "Country is required";
    }

    if (!formData.password.trim()) {

      newErrors.password =
        "Password is required";

    } else if (
      formData.password.length < 6
    ) {

      newErrors.password =
        "Password must be at least 6 characters";
    }

    if (!agree) {
      newErrors.agree = "You must agree to the Terms & Conditions and Privacy Policy";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };



  // REGISTER
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {

      const response = await fetch(
        getApiUrl("auth/register"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...formData,
            acceptedTerms: agree,
            termsVersion: "2026-06",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || "Registration failed. Please try again." });
        console.error("[RegisterForm] Registration error:", data.message);
        return;
      }

      // Navigate to login on success — no alert()
      navigate("/");

    } catch (error) {

      console.error("[RegisterForm] Network error during registration:", error);
      setErrors({ general: "Connection error. Please check your internet and try again." });

    } finally {

      // ALWAYS reset loading regardless of success or failure
      setLoading(false);
    }
  };



  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* GENERAL ERROR */}
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
          {errors.general}
        </div>
      )}

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



      <InputField
        label="Additional Information"
        type="text"
        name="additionalInfo"
        placeholder="Testing details"
        icon={FileText}
        value={formData.additionalInfo}
        onChange={handleChange}
        error={errors.additionalInfo}
      />

      {/* TERMS & CONDITIONS CHECKBOX */}
      <div className="flex flex-col gap-1 my-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              setErrors((prev) => ({ ...prev, agree: "" }));
            }}
            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-1 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            I agree to the{" "}
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline"
            >
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agree && (
          <p className="text-xs text-rose-500 font-bold mt-1 pl-7">{errors.agree}</p>
        )}
      </div>

      <Button
        type="submit"
        text="Create Account"
        loading={loading}
        icon={ShieldCheck}
      />
    </form>
  );
};

export default RegisterForm;