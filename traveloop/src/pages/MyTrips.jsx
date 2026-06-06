// src/pages/MyTrips.jsx — Premium redesign

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Map, CalendarDays, MapPin, Clock, Plus, ListChecks,
  StickyNote, Package, Compass, ChevronRight, Trash2,
  Star, DollarSign
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { subscribeUnreadCount } from "../services/chatService";
import { auth } from "../services/firebase";

// ─── GRADIENT COVERS (for trips without images) ───────────────
const COVERS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
  "linear-gradient(135deg,#14B8B5,#0D9488)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
];

const DEST_EMOJIS = { "Goa": "🏖️", "Bali": "🌴", "Paris": "🗼", "Tokyo": "🌸", "Maldives": "🐚", "Switzerland": "🏔️", "default": "✈️" };
const getEmoji = (dest = "") => {
  for (const key of Object.keys(DEST_EMOJIS)) {
    if (key !== "default" && dest.toLowerCase().includes(key.toLowerCase())) return DEST_EMOJIS[key];
  }
  return DEST_EMOJIS.default;
};

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUS_CONFIG = {
  upcoming:  { label: "Upcoming",  bg: "bg-blue-500",   text: "text-white" },
  ongoing:   { label: "Ongoing",   bg: "bg-emerald-500", text: "text-white" },
  completed: { label: "Completed", bg: "bg-slate-400",   text: "text-white" },
  planning:  { label: "Planning",  bg: "bg-amber-500",   text: "text-white" },
};

// ─── PREMIUM TRIP CARD ────────────────────────────────────────
const PremiumTripCard = ({ trip, index, onClick, onStatusClick, unreadCount }) => {
  const navigate = useNavigate();
  const status   = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;
  const cover    = COVERS[index % COVERS.length];
  const emoji    = getEmoji(trip.destination);
  const [imageError, setImageError] = useState(false);

  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
    : null;

  const daysLeft = trip.startDate
    ? Math.max(0, Math.ceil((new Date(trip.startDate) - new Date()) / 86400000))
    : null;

  const ACTIONS = [
    { icon: ListChecks, label: "Itinerary",  path: `/build-itinerary/${trip._id}`,   color: "text-teal-600",   bg: "bg-teal-50" },
    { icon: Package,    label: "Packing",    path: `/packing-checklist/${trip._id}`, color: "text-amber-600",  bg: "bg-amber-50" },
    { icon: DollarSign, label: "Budget",     path: `/trip-budget/${trip._id}`,       color: "text-rose-600",   bg: "bg-rose-50" },
    { icon: StickyNote, label: "Notes",      path: `/trip-notes/${trip._id}`,        color: "text-violet-600", bg: "bg-violet-50" },
    { icon: Compass,    label: "Activities", path: `/activities/${trip._id}`,        color: "text-blue-600",   bg: "bg-blue-50" },
  ];

  const userRole = trip.role || "owner";
  const isShared = trip.collaborators && trip.collaborators.some(c => c.acceptedAt !== null);

  const badgeText = isShared 
    ? `Shared • ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` 
    : (userRole === "owner" ? "" : userRole.charAt(0).toUpperCase() + userRole.slice(1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileTap={{ scale: 0.985 }}
      className="premium-card overflow-hidden cursor-pointer"
      onClick={() => onClick(trip)}
    >
      {/* ── COVER ── */}
      <div className="relative h-44 overflow-hidden" style={{ background: cover }}>
        {/* Fallback layer in background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl">{emoji}</span>
        </div>

        {/* Custom Image layer on top */}
        {trip.image && !imageError && (
          <img
            src={trip.image}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => setImageError(true)}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-20" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)" }} />

        {/* Status badge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick(trip._id, trip.status || "planning");
          }}
          className={`absolute top-4 right-4 z-30 px-3 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text} shadow-xs active:scale-95 transition-all`}
          aria-label={`Change status for ${trip.title}, current status: ${status.label}`}
        >
          {status.label}
        </button>

        {/* Days left pill */}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="absolute top-4 left-4 z-30 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-700">{daysLeft}d to go</span>
          </div>
        )}

        {/* Trip name over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
          <h3 className="text-white font-extrabold text-lg leading-tight" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{trip.title}</h3>
          <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={12} className="text-white/70 flex-shrink-0" />
              <span className="text-white/70 text-xs truncate max-w-[140px]">{trip.destination}</span>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* V1.4 Role Badge */}
              {badgeText && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 text-white border border-white/10 uppercase tracking-wider backdrop-blur-xs">
                  {badgeText}
                </span>
              )}
              {(unreadCount > 0 || (!unreadCount && trip.unreadCount > 0)) && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white border border-rose-400 uppercase tracking-wider">
                  💬 {unreadCount || trip.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO ROW ── */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          {trip.startDate && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
              <CalendarDays size={12} className="text-teal-500" />
              <span>{new Date(trip.startDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}</span>
            </div>
          )}
          {days && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
              <Clock size={12} className="text-violet-500" />
              <span>{days} days</span>
            </div>
          )}
          {trip.budget && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 flex-shrink-0">
              <DollarSign size={12} />
              <span className="budget-amount">₹{trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-3 py-3 flex gap-2">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); navigate(action.path); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-[14px] ${action.bg} ${action.color} transition-all min-h-[48px]`}
              aria-label={`Open ${action.label} for ${trip.title}`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-semibold">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── FILTER CHIPS ─────────────────────────────────────────────
const FILTERS = ["All", "Upcoming", "Ongoing", "Planning", "Completed"];

// ─── MY TRIPS PAGE ────────────────────────────────────────────
const MyTrips = () => {
  const navigate = useNavigate();
  const { user, isInitialized, firebaseUser } = useAuth();
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");
  const [selectedTripForStatus, setSelectedTripForStatus] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!user || trips.length === 0 || !isInitialized || !firebaseUser) return;
    const unsubscribes = trips.map((t) => {
      return subscribeUnreadCount(t._id, user.id || user._id, (count) => {
        setUnreadCounts((prev) => ({
          ...prev,
          [t._id]: count
        }));
      });
    });
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [trips, user, isInitialized, firebaseUser]);

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTrips(prev =>
          prev.map(t => (t._id === tripId ? { ...t, status: newStatus } : t))
        );
        setSelectedTripForStatus(null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const fetchTrips = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(getApiUrl("trips"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTrips(data.trips);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTrips();

    window.addEventListener("refreshTrips", fetchTrips);
    return () => {
      window.removeEventListener("refreshTrips", fetchTrips);
    };
  }, [fetchTrips]);

  const filtered = trips.filter(t => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" || (t.status || "planning").toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-6">

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3.5 mb-4 rounded-[18px] bg-white border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all duration-200"
        >
          <Map size={18} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trips, destinations..."
            className="flex-1 bg-transparent text-slate-700 text-sm font-medium placeholder:text-slate-400 outline-none"
            aria-label="Search trips and destinations"
          />
        </motion.div>

        {/* Filter chips */}
        <div className="chip-row mb-5 -mx-4 px-4">
          {FILTERS.map((f, i) => (
            <motion.button
              key={f}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.90 }}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                filter === f
                  ? "text-white shadow-brand"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
              style={filter === f ? { background: "linear-gradient(135deg, #14B8B5, #0D9488)" } : {}}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          /* Skeleton */
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="premium-card overflow-hidden">
                <div className="h-44 skeleton" />
                <div className="p-4">
                  <div className="h-4 skeleton rounded-lg w-3/4 mb-2" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-5"
          >
            <div
              className="w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl"
              style={{ background: "linear-gradient(135deg, rgba(20,184,181,0.1), rgba(20,184,181,0.05))" }}
            >
              🗺️
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-slate-700">
                {trips.length === 0 ? "No trips yet" : "No results"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {trips.length === 0 ? "Start planning your first adventure!" : "Try a different search"}
              </p>
            </div>
            {trips.length === 0 && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/create-trip")}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-bold shadow-brand"
                style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
              >
                <Plus size={18} />
                Plan a Trip
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filtered.map((trip, i) => (
                <PremiumTripCard
                  key={trip._id}
                  trip={trip}
                  index={i}
                  unreadCount={unreadCounts[trip._id] || 0}
                  onStatusClick={(id, curStatus) => setSelectedTripForStatus({ id, status: curStatus })}
                  onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Status Picker Bottom Sheet */}
      <BottomSheet
        isOpen={selectedTripForStatus !== null}
        onClose={() => setSelectedTripForStatus(null)}
        title="Update Trip Status"
        snapPoints={["40vh"]}
      >
        <div className="space-y-3">
          {Object.keys(STATUS_CONFIG).map((key) => {
            const cfg = STATUS_CONFIG[key];
            const isSelected = selectedTripForStatus?.status === key;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpdateStatus(selectedTripForStatus.id, key)}
                className={`w-full flex items-center justify-between p-4 rounded-[20px] border transition-colors ${
                  isSelected 
                    ? "border-teal-400 bg-teal-50/30 text-teal-800" 
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-sm font-bold">{cfg.label}</span>
                <span className={`w-3.5 h-3.5 rounded-full ${cfg.bg}`} />
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>
    </MainLayout>
  );
};

export default MyTrips;