import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/common/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Phone, MapPin, Globe, CalendarDays, ShieldCheck,
  ChevronRight, Bell, Lock, Eye, Palette, HelpCircle, LogOut,
  Camera, Map, Plane, Clock, Moon, Sun, Award, Flame, Star,
  Languages, ChevronDown, Heart, AlertTriangle, Trash2, FileText
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import { useToast } from "../components/mobile/MobileToast";

// STATS is now calculated dynamically inside the Profile component

const ACHIEVEMENTS = [
  { emoji: "🏆", label: "First Trip Created", desc: "Created your first trip" },
  { emoji: "🏆", label: "Explorer", desc: "Created 5 trips" },
  { emoji: "🏆", label: "Planner Pro", desc: "Created 10 trips" },
  { emoji: "🏆", label: "Collaboration Pro", desc: "Collaborate on a trip" },
  { emoji: "🏆", label: "Budget Master", desc: "Logged your first expense" },
  { emoji: "🏆", label: "Journal Keeper", desc: "Created a journal entry" },
  { emoji: "🏆", label: "Flight Tracker", desc: "Tracked your first flight" },
  { emoji: "🏆", label: "Chat Starter", desc: "Sent your first chat message" },
];

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      { icon: User,       label: "Personal Info",      sub: "Update your profile details",     color: "#14B8B5", bg: "rgba(20,184,181,0.1)"  },
      { icon: Heart,      label: "Saved Places",       sub: "View your bucket list cities",    color: "#EF4444", bg: "rgba(239,68,68,0.1)", path: "/saved-destinations" },
      { icon: ShieldCheck,label: "Security",           sub: "Password & authentication",        color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
      { icon: Bell,       label: "Notifications",      sub: "Manage alerts & reminders",        color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Eye,        label: "Privacy",            sub: "Control your data & visibility",  color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
      { icon: Languages,  label: "Language",           sub: "English (India)",                  color: "#3B82F6", bg: "rgba(59,130,246,0.1)"  },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help & Support",     sub: "FAQs, contact us",                color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
      { icon: FileText,   label: "Terms & Conditions", sub: "View our terms and conditions",   color: "#14B8B5", bg: "rgba(20,184,181,0.1)", path: "/terms-and-conditions" },
    ],
  },
];

const Profile = () => {
  const navigate  = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [logoutSheet, setLogoutSheet] = useState(false);
  const toast = useToast();

  // Sheets state
  const [personalSheet, setPersonalSheet] = useState(false);
  const [securitySheet, setSecuritySheet] = useState(false);
  const [notificationSheet, setNotificationSheet] = useState(false);
  const [privacySheet, setPrivacySheet] = useState(false);
  const [languageSheet, setLanguageSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);
  const [deleteConfirmSheet, setDeleteConfirmSheet] = useState(false);

  // Forms state
  const [profileUser, setProfileUser] = useState(null);
  const [personalForm, setPersonalForm] = useState({ firstName: "", lastName: "", phone: "", city: "", country: "", upiId: "" });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifForm, setNotifForm] = useState({ reminders: true, budget: true, weather: true, statusUpdates: true });
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
      }
    };
    fetchProfile();
  }, []);
  const [deleteText, setDeleteText] = useState("");
  const [supportForm, setSupportForm] = useState({ email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("trips"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTrips(data.trips || []);
        }
      } catch (err) {
        console.error("Failed to fetch trips for profile stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchTrips();
  }, []);

  const stats = useMemo(() => {
    const tripsCount = trips.length;
    const countriesCount = new Set(trips.map(t => {
      if (!t.destination) return "";
      const parts = t.destination.split(",");
      return parts[parts.length - 1].trim();
    }).filter(Boolean)).size;
    const totalDays = trips.reduce((sum, trip) => {
      if (!trip.startDate || !trip.endDate) return sum + 1;
      const diff = new Date(trip.endDate) - new Date(trip.startDate);
      return sum + Math.max(1, Math.ceil(diff / 86400000));
    }, 0);

    return [
      { icon: Map,   label: "Trips",     value: loadingStats ? "..." : String(tripsCount), color: "#14B8B5", bg: "rgba(20,184,181,0.1)"  },
      { icon: Globe, label: "Countries", value: loadingStats ? "..." : String(countriesCount),  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
      { icon: Clock, label: "Days",      value: loadingStats ? "..." : String(totalDays), color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    ];
  }, [trips, loadingStats]);

  const { user: authUser, logout, login } = useAuth();

  useEffect(() => {
    if (authUser) {
      setProfileUser(authUser);
      setPersonalForm({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phone || "",
        city: authUser.city || "",
        country: authUser.country || "",
        upiId: authUser.upiId || "",
      });
      if (authUser.notificationPreferences) {
        setNotifForm({
          reminders: authUser.notificationPreferences.reminders !== false,
          budget: authUser.notificationPreferences.budget !== false,
          weather: authUser.notificationPreferences.weather !== false,
          statusUpdates: authUser.notificationPreferences.statusUpdates !== false,
        });
      }
    }
  }, [authUser]);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setProfileUser(e.detail);
        setPersonalForm({
          firstName: e.detail.firstName || "",
          lastName: e.detail.lastName || "",
          phone: e.detail.phone || "",
          city: e.detail.city || "",
          country: e.detail.country || "",
          upiId: e.detail.upiId || "",
        });
        if (e.detail.notificationPreferences) {
          setNotifForm({
            reminders: e.detail.notificationPreferences.reminders !== false,
            budget: e.detail.notificationPreferences.budget !== false,
            weather: e.detail.notificationPreferences.weather !== false,
            statusUpdates: e.detail.notificationPreferences.statusUpdates !== false,
          });
        }
      }
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  if (!profileUser) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl">😕</span>
          <p className="text-xl font-bold text-slate-700">Not logged in</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-full text-white font-bold" style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}>
            Go to Login
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const updateProfileDetails = async (bodyPayload, successMsg) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/update"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setProfileUser(data.user);
        login(data.user, token); // Keep AuthContext sync'd
        alert(successMsg || "Settings updated successfully! ✨");
        return true;
      } else {
        alert(data.message || "Failed to update profile");
        return false;
      }
    } catch (err) {
      alert("Error connecting to server");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 512;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target.result;
      try {
        const compressedBase64 = await compressImage(originalBase64);
        
        // Optimistic update
        const updatedUser = { ...profileUser, avatar: compressedBase64 };
        setProfileUser(updatedUser);
        
        const ok = await updateProfileDetails({ avatar: compressedBase64 }, "Profile picture updated successfully! 📸");
        if (!ok) {
          setProfileUser(profileUser);
        }
      } catch (err) {
        console.error("Failed to compress or upload image", err);
        alert("Failed to process image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    const ok = await updateProfileDetails(personalForm, "Profile updated successfully! 👤");
    if (ok) setPersonalSheet(false);
  };

  const handleNotifToggle = async (field) => {
    const updated = { ...notifForm, [field]: !notifForm[field] };
    setNotifForm(updated);
    await updateProfileDetails({ notificationPreferences: updated }, "Notifications updated! 🔔");
  };

  const handleLanguageSelect = async (langCode, langName) => {
    const ok = await updateProfileDetails({ language: langCode }, `Language set to ${langName}! 🌐`);
    if (ok) setLanguageSheet(false);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password update simulated successfully for production deployment!");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSecuritySheet(false);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const userEmail = (supportForm.email || profileUser.email || "").trim();
    const message = (supportForm.message || "").trim();

    if (!userEmail) {
      toast.error("Email is required.");
      return;
    }
    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!message) {
      toast.error("Message is required.");
      return;
    }
    if (message.length <= 5) {
      toast.error("Message must be longer than 5 characters.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userName = `${profileUser.firstName || ""} ${profileUser.lastName || ""}`.trim() || profileUser.email;
      
      const res = await fetch(getApiUrl("support"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          message: message
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Support request sent successfully.");
        setSupportForm(f => ({ ...f, message: "" })); // keep email field, clear message field
        setHelpSheet(false);
      } else {
        toast.error(data.message || "Failed to send support request.");
      }
    } catch (err) {
      console.error("Support Route Error:", err);
      toast.error("Failed to send support request.");
    }
  };

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileUser, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `traveloop_profile_${profileUser.firstName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/delete-account"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert("Account permanently deleted. Hope to travel with you again! ✈️");
        logout();
        navigate("/");
      } else {
        alert(data.message || "Failed to delete account");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setSubmitting(false);
    }
  };

  const initial = profileUser.firstName?.[0]?.toUpperCase() || "T";

  return (
    <MainLayout>
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F172A 0%, #14B8B5 100%)" }} />
        <motion.div animate={{ x: [0,20,0], y: [0,-10,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <motion.div animate={{ x: [0,-15,0], y: [0,10,0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-teal-400/15" />
        <div className="absolute top-6 right-24 w-16 h-16 rounded-full bg-white/5" />
        <Plane size={24} className="absolute top-8 left-6 text-white/20 rotate-12" />
      </div>

      {/* ── AVATAR SECTION ── */}
      <div className="px-4 -mt-14 mb-5">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-float overflow-hidden flex items-center justify-center">
              <Avatar user={profileUser} size={88} />
            </div>
            <label className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-sm cursor-pointer">
              <Camera size={12} className="text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {profileUser.authProvider === "google" ? (
              <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-1.5">
                <span className="text-blue-700 text-xs font-bold">Google Connected</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                <span className="text-slate-700 text-xs font-bold">Email Connected</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-emerald-700 text-xs font-bold">Verified</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-extrabold text-slate-800">{profileUser.firstName} {profileUser.lastName}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{profileUser.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-500">{profileUser.streak || 0} day planning streak</span>
          </div>

          {/* Level and XP Progress Bar */}
          <div className="mt-3 max-w-[280px]">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
              <span>Level {profileUser.level || 1}</span>
              <span className="text-slate-400">{(profileUser.xp || 0) % 100} / 100 XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full" 
                style={{ width: `${(profileUser.xp || 0) % 100}%`, transition: "width 0.5s ease-out" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mb-5 premium-card p-4"
      >
        <div className="flex items-center justify-around">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.2, type: "spring" }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <span className="text-xl font-extrabold text-slate-800">{s.value}</span>
                <span className="text-[11px] font-semibold text-slate-400">{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── ACHIEVEMENTS ── */}
      <div className="mx-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-amber-500" />
          <h3 className="text-[17px] font-bold text-slate-800">Achievements</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          {(achievements.length > 0 ? achievements : ACHIEVEMENTS).map((badge, i) => (
            <motion.div
              key={badge.title || badge.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 + 0.2 }}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-[20px] bg-white border border-slate-100 shadow-xs w-24 transition-opacity duration-300 ${
                badge.unlocked === false ? "opacity-40" : "opacity-100"
              }`}
            >
              <span className="text-3xl">{badge.icon || badge.emoji}</span>
              <p className="text-[11px] font-bold text-slate-700 text-center leading-tight">{badge.title || badge.label}</p>
              <p className="text-[9px] text-slate-400 text-center leading-tight">{badge.description || badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── DARK MODE TOGGLE ── */}
      <div className="mx-4 mb-4 premium-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: isDark ? "rgba(15,23,42,0.15)" : "rgba(245,158,11,0.1)" }}>
            {isDark ? <Moon size={18} className="text-slate-700" /> : <Sun size={18} className="text-amber-500" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Dark Mode</p>
            <p className="text-xs text-slate-400">{isDark ? "Dark theme active" : "Light theme active"}</p>
          </div>
        </div>
        <motion.button
          onClick={toggleTheme}
          className="relative w-14 h-7 rounded-full transition-colors duration-300"
          style={{ background: isDark ? "#14B8B5" : "#E2E8F0" }}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ left: isDark ? "calc(100% - 24px)" : "4px" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </motion.button>
      </div>

      {/* ── SETTINGS GROUPS ── */}
      {SETTINGS_GROUPS.map((group, gi) => (
        <div key={group.title} className="mx-4 mb-4 premium-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title}</p>
          </div>
          {group.items.map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  } else {
                    if (item.label === "Personal Info") setPersonalSheet(true);
                    if (item.label === "Security") setSecuritySheet(true);
                    if (item.label === "Notifications") setNotificationSheet(true);
                    if (item.label === "Privacy") setPrivacySheet(true);
                    if (item.label === "Language") setLanguageSheet(true);
                    if (item.label === "Help & Support") setHelpSheet(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left active:bg-slate-50 transition-colors ${
                  idx < arr.length - 1 ? "border-b border-slate-50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.label === "Personal Info" && profileUser.upiId ? `UPI ID: ${profileUser.upiId}` : item.sub}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      ))}

      {/* ── LOGOUT ── */}
      <div className="mx-4 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setLogoutSheet(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] bg-red-50 border border-red-100 text-red-500 font-bold text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </motion.button>
      </div>

      {/* ── VERSION DISPLAY ── */}
      <div className="text-center pb-24">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Traveloop v1.0.0 (Release Candidate)</p>
      </div>

      {/* ── PERSONAL INFO SHEET ── */}
      <BottomSheet isOpen={personalSheet} onClose={() => setPersonalSheet(false)} title="Personal Info" snapPoints={["65vh"]}>
        <form onSubmit={handlePersonalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">First Name</label>
              <input
                type="text"
                required
                value={personalForm.firstName}
                onChange={e => setPersonalForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Last Name</label>
              <input
                type="text"
                required
                value={personalForm.lastName}
                onChange={e => setPersonalForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Phone Number</label>
            <input
              type="tel"
              value={personalForm.phone}
              onChange={e => setPersonalForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">UPI ID (for splitting settlement)</label>
            <input
              type="text"
              value={personalForm.upiId || ""}
              onChange={e => setPersonalForm(f => ({ ...f, upiId: e.target.value }))}
              placeholder="e.g. username@upi"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">City</label>
              <input
                type="text"
                value={personalForm.city}
                onChange={e => setPersonalForm(f => ({ ...f, city: e.target.value }))}
                placeholder="City"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Country</label>
              <input
                type="text"
                value={personalForm.country}
                onChange={e => setPersonalForm(f => ({ ...f, country: e.target.value }))}
                placeholder="Country"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
              />
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={submitting}
            type="submit"
            className="w-full py-4 rounded-full text-white font-bold text-sm shadow-brand mt-2"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </motion.button>
        </form>
      </BottomSheet>

      {/* ── SECURITY SHEET ── */}
      <BottomSheet isOpen={securitySheet} onClose={() => setSecuritySheet(false)} title="Security" snapPoints={["55vh"]}>
        <form onSubmit={handleSecuritySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={securityForm.currentPassword}
              onChange={e => setSecurityForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">New Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={securityForm.newPassword}
              onChange={e => setSecurityForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Re-enter new password"
              value={securityForm.confirmPassword}
              onChange={e => setSecurityForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-4 rounded-full text-white font-bold text-sm shadow-brand mt-2"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            Update Password
          </motion.button>
        </form>
      </BottomSheet>

      {/* ── NOTIFICATIONS SHEET ── */}
      <BottomSheet isOpen={notificationSheet} onClose={() => setNotificationSheet(false)} title="Notifications" snapPoints={["50vh"]}>
        <div className="space-y-4 divide-y divide-slate-100">
          {[
            { key: "reminders", title: "Trip Reminders", desc: "Alerts for packing lists and upcoming flights" },
            { key: "budget", title: "Budget Updates", desc: "Alert when expenses cross 85% or 100% limits" },
            { key: "weather", title: "Weather Warnings", desc: "Advisories for extreme temperatures or storms" },
            { key: "statusUpdates", title: "Trip Status Alerts", desc: "Confirm when trips transition to ongoing or completed" },
          ].map((item, idx) => (
            <div key={item.key} className={`flex items-center justify-between ${idx > 0 ? "pt-4" : ""}`}>
              <div className="pr-4">
                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => handleNotifToggle(item.key)}
                className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
                style={{ background: notifForm[item.key] ? "#14B8B5" : "#E2E8F0" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs"
                  style={{ left: notifForm[item.key] ? "calc(100% - 22px)" : "2px", transition: "left 0.2s" }}
                />
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* ── PRIVACY SHEET ── */}
      <BottomSheet isOpen={privacySheet} onClose={() => setPrivacySheet(false)} title="Privacy & Data Control" snapPoints={["52vh"]}>
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-bold text-slate-800">Your Data Rights</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              We respect your privacy. Under Play Store rules, you can download a full backup copy of your data at any time, or permanently delete your account and wipe all records from our database.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 active:bg-slate-50 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700">Download My Data</p>
                <p className="text-xs text-slate-400 mt-0.5">Export profile settings as a JSON file</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                setPrivacySheet(false);
                setDeleteConfirmSheet(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50 active:bg-red-50 transition-colors text-red-600"
            >
              <div className="text-left">
                <p className="text-sm font-bold">Delete Account & Data</p>
                <p className="text-xs text-red-400 mt-0.5">Permanently wipe your profile and trips</p>
              </div>
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── LANGUAGE SHEET ── */}
      <BottomSheet isOpen={languageSheet} onClose={() => setLanguageSheet(false)} title="Select Language" snapPoints={["42vh"]}>
        <div className="space-y-3">
          {[
            { code: "en", name: "English (India)", native: "English" },
            { code: "ta", name: "Tamil", native: "தமிழ்" },
            { code: "hi", name: "Hindi", native: "हिन्दी" }
          ].map(lang => {
            const isSelected = profileUser.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code, lang.name)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  isSelected ? "border-teal-400 bg-teal-50/50" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{lang.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{lang.native}</p>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ── HELP & SUPPORT SHEET ── */}
      <BottomSheet isOpen={helpSheet} onClose={() => setHelpSheet(false)} title="Help & Support" snapPoints={["80vh"]}>
        <div className="space-y-6">
          {/* FAQs */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Frequently Asked Questions</h4>
            <div className="space-y-3">
              {[
                { q: "How do I create a new trip?", a: "Navigate to the Dashboard and click 'Plan a Trip' to launch the wizard." },
                { q: "Can I share my itinerary with friends?", a: "Yes, open your trip, click the share icon or itinerary options, and toggle 'Public Share' to get a link." },
                { q: "Does weather warnings update automatically?", a: "Yes, our dashboard and itinerary views refresh meteorological reports dynamically." },
              ].map((faq, index) => (
                <details key={index} className="group p-3 rounded-xl border border-slate-100 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                    <p className="text-sm font-bold text-slate-700 pr-4">{faq.q}</p>
                    <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* SUPPORT FORM */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Submit a Support Ticket</h4>
            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder={profileUser.email}
                  value={supportForm.email || profileUser.email}
                  onChange={e => setSupportForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How can we help you?"
                  value={supportForm.message}
                  onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 resize-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-3 rounded-full text-white font-bold text-xs shadow-brand mt-1"
                style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
              >
                Send Message
              </motion.button>
            </form>
          </div>
        </div>
      </BottomSheet>

      {/* ── DELETE ACCOUNT CONFIRMATION SHEET ── */}
      <BottomSheet isOpen={deleteConfirmSheet} onClose={() => setDeleteConfirmSheet(false)} title="Danger Zone" snapPoints={["50vh"]}>
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Permanently Delete Account?</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[280px] mx-auto">
              This action is irreversible. All your trips, checklists, notes, budget logs, and itineraries will be permanently erased.
            </p>
          </div>
          <div>
            <label className="block text-left text-[10px] font-bold text-slate-400 uppercase mb-1.5">Type "DELETE" to confirm</label>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-red-200 text-sm font-extrabold tracking-widest text-center uppercase outline-none focus:border-red-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmSheet(false)}
              className="flex-1 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteText !== "DELETE" || submitting}
              className="flex-1 py-3.5 rounded-full bg-red-500 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── LOGOUT SHEET ── */}
      <AnimatePresence>
        {logoutSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutSheet(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] p-6"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
            >
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <LogOut size={28} className="text-red-400" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">Sign Out?</h3>
                <p className="text-slate-400 text-sm mt-1">You'll need to login again to access your trips.</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLogoutSheet(false)}
                  className="flex-1 py-4 rounded-full bg-slate-100 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex-1 py-4 rounded-full bg-red-500 text-white font-bold text-sm shadow-sm"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default Profile;